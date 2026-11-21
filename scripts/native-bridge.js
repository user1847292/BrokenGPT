import { SpeechRecognition } from "@capacitor-community/speech-recognition";

// Capacitor plugins are bundled into the web assets but only exposed inside
// the native Android/iOS WebView. Regular browser previews keep using Web Speech.
if (window.Capacitor?.isNativePlatform?.()) {
  window.BrokenGPTNativeSpeechRecognition = SpeechRecognition;
}
