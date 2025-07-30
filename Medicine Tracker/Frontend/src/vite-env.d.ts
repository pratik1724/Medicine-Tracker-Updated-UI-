/// <reference types="vite/client" />
// Extend the ImportMetaEnv interface to include your custom environment variables
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // Add other environment variables here if you use them, e.g.:
  // readonly VITE_ANALYTICS_KEY: string;
}

// Extend the ImportMeta interface to ensure 'env' property is recognized
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Declare the SpeechRecognition interface globally to extend the Window object
interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}
