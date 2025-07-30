from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson.objectid import ObjectId
import re
from prophet import Prophet
import pandas as pd
from fuzzywuzzy import process

app = Flask(__name__)
CORS(app)

# --- CORRECTED LIST ---
# Added 'mill' to the list of words to ignore.
STOP_WORDS = ['use', 'used', 'ml', 'mill', 'Min', 'Mill', 'for', 'milliliter', 'milliliters']

# MongoDB Connection
client = MongoClient("mongodb://localhost:27017/")
db = client["surgical_medicine"]
log_collection = db["medicine_usage"]
thresholds_collection = db["medicine_thresholds"]

INITIAL_CAPACITY_ML = 100
DEFAULT_MEDICINE_THRESHOLDS = {}
YELLOW_THRESHOLD = 40
ORANGE_THRESHOLD = 30
RED_THRESHOLD = 29

def initialize_medicine_thresholds():
    for med, threshold in DEFAULT_MEDICINE_THRESHOLDS.items():
        if not thresholds_collection.find_one({"medicine": med}):
            thresholds_collection.insert_one({"medicine": med, "threshold": threshold})
            print(f"Added default medicine threshold for: {med}")

with app.app_context():
    initialize_medicine_thresholds()

def calculate_current_remaining(medicine_name):
    total_net_change_from_logs = sum([entry['quantity'] for entry in log_collection.find({"medicine": medicine_name})])
    remaining = INITIAL_CAPACITY_ML - total_net_change_from_logs
    return remaining

def predict_depletion(medicine, current_remaining):
    usage_entries = list(log_collection.find({"medicine": medicine, "quantity": {"$gt": 0}}))
    if not usage_entries:
        return "N/A - No usage data"
    usage_entries.sort(key=lambda x: x['timestamp'])
    first_usage_date = usage_entries[0]['timestamp']
    total_usage_since_first = sum([entry['quantity'] for entry in usage_entries])
    time_span_days = (datetime.now() - first_usage_date).days
    if time_span_days == 0:
        time_span_days = 1
    daily_avg_usage = total_usage_since_first / time_span_days
    if daily_avg_usage > 0:
        days_to_depletion = current_remaining / daily_avg_usage
        if days_to_depletion < 0:
            return "Already Depleted"
        depletion_date = datetime.now() + timedelta(days=days_to_depletion)
        return depletion_date.strftime("%Y-%m-%d")
    else:
        return "N/A - No average usage or sufficient stock"

@app.route("/usage_log")
def usage_log_api():
    logs = list(log_collection.find().sort("timestamp", -1))
    for log in logs:
        log["_id"] = str(log["_id"])
        log["timestamp"] = log["timestamp"].isoformat()
    return jsonify({"logs": logs})

@app.route("/restock")
def restock_api():
    summary = {}
    all_medicines = {doc['medicine'] for doc in log_collection.find({}, {'medicine': 1})}
    for med in all_medicines:
        current_remaining = calculate_current_remaining(med)
        depletion = predict_depletion(med, current_remaining)
        summary[med] = {"remaining": current_remaining, "depletion_date": depletion}
    return jsonify({"summary": summary})

@app.route("/buy_list")
def buy_list_api():
    buy_list = []
    all_medicines = {doc['medicine'] for doc in log_collection.find({}, {'medicine': 1})}
    for med in all_medicines:
        current_remaining = calculate_current_remaining(med)
        item_color = ""
        if current_remaining <= RED_THRESHOLD:
            item_color = "red"
        elif current_remaining <= ORANGE_THRESHOLD:
            item_color = "orange"
        elif current_remaining <= YELLOW_THRESHOLD:
            item_color = "yellow"
        else:
            continue
        if item_color:
            buy_list.append({"medicine": med, "remaining": current_remaining, "color": item_color})
    
    color_priority = {"red": 1, "orange": 2, "yellow": 3}
    buy_list.sort(key=lambda x: (color_priority.get(x['color'], 99), x['remaining']))
    return jsonify({"buy_list": buy_list})

@app.route("/log_usage", methods=["POST"])
def log_usage():
    data = request.get_json()
    usage_text = data.get('text', '').strip()
    if not usage_text:
        return jsonify({"success": False, "message": "Usage text cannot be empty."}), 400
    try:
        words = usage_text.lower().split()
        quantity = None
        name_parts = []
        for word in words:
            numeric_part_match = re.search(r'(\d+(\.\d+)?)', word)
            if numeric_part_match:
                quantity = float(numeric_part_match.group(1))
            elif word not in STOP_WORDS:
                name_parts.append(word)
        medicine_name = ' '.join(name_parts).strip()
        if not medicine_name or quantity is None:
            raise ValueError("Invalid format. Please use 'medicine_name quantity'.")
        if not thresholds_collection.find_one({"medicine": medicine_name}):
            thresholds_collection.insert_one({"medicine": medicine_name, "threshold": 20})
        log_collection.insert_one({
            "medicine": medicine_name,
            "quantity": quantity,
            "timestamp": datetime.now()
        })
        return jsonify({"success": True, "message": f"Logged {quantity}ml for {medicine_name}"})
    except ValueError as e:
        return jsonify({"success": False, "message": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "message": "An unexpected server error occurred."}), 500

@app.route("/restock_medicine", methods=["GET", "POST"])
def restock_medicine_api():
    if request.method == "POST":
        med = request.form["medicine"]
        quantity = int(request.form["quantity"])
        log_collection.insert_one({"medicine": med, "quantity": -quantity, "timestamp": datetime.now()})
        return jsonify({"success": True, "message": f"{quantity}ml of {med} restocked successfully."})
    else:
        medicines = [doc["medicine"] for doc in thresholds_collection.find({}, {"_id": 0, "medicine": 1})]
        return jsonify({"medicines": medicines})

@app.route('/api/items/suggest', methods=['GET'])
def suggest_items():
    query = request.args.get('q', '').lower()
    if not query:
        return jsonify([])
    all_item_names = log_collection.distinct("medicine")
    matches = process.extractBests(query, all_item_names, score_cutoff=75, limit=3)
    suggestions = [{"id": i, "name": match[0]} for i, match in enumerate(matches)]
    return jsonify(suggestions)

@app.route("/forecast")
def forecast_api():
    all_logs = list(log_collection.find())
    usage_data = []
    for log in all_logs:
        if log['quantity'] > 0:
            usage_data.append({'ds': log['timestamp'], 'medicine': log['medicine'], 'y': log['quantity']})
    if not usage_data:
        return jsonify({"stock_alerts": {"info": "No sufficient usage data to generate forecasts."}})
    df_all_usage = pd.DataFrame(usage_data)
    df_all_usage['ds'] = pd.to_datetime(df_all_usage['ds'])
    stock_alerts = {}
    for med in df_all_usage['medicine'].unique():
        med_df = df_all_usage[df_all_usage['medicine'] == med][['ds', 'y']]
        if med_df.empty or len(med_df) < 2:
            stock_alerts[med] = "Insufficient usage data for forecasting"
            continue
        try:
            model = Prophet(daily_seasonality=True, changepoint_prior_scale=0.05)
            model.fit(med_df)
            future = model.make_future_dataframe(periods=14)
            forecast_result = model.predict(future)
            current_remaining_stock = calculate_current_remaining(med)
            depletion_day = None
            simulated_remaining = current_remaining_stock
            for _, row in forecast_result[-14:].iterrows():
                predicted_usage = max(row['yhat'], 0)
                simulated_remaining -= predicted_usage
                if simulated_remaining <= 0:
                    depletion_date = row['ds']
                    days_until_depletion = (depletion_date - datetime.today()).days
                    depletion_day = days_until_depletion
                    break
            if depletion_day is not None and depletion_day >= 0:
                stock_alerts[med] = f"needed in {depletion_day} days"
            elif depletion_day is not None:
                stock_alerts[med] = "already depleted"
            else:
                stock_alerts[med] = "sufficient for now"
        except Exception as e:
            stock_alerts[med] = f"Forecast error: {str(e)}"
    return jsonify({"stock_alerts": stock_alerts})

if __name__ == "__main__":
    app.run(debug=True, port=5000)