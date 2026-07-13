/* Voice pipeline — thin wrappers over the Web Speech API.
   Degrades gracefully where unsupported (most non-Chromium browsers for STT). */

const SPEECH_LANGS = {
  en: "en-IN", hi: "hi-IN", bn: "bn-IN", ta: "ta-IN", te: "te-IN",
  mr: "mr-IN", pa: "pa-IN", or: "or-IN", gu: "gu-IN", kn: "kn-IN", ml: "ml-IN",
};

const Recognition = typeof window !== "undefined"
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null;

export const voice = {
  sttSupported: !!Recognition,
  ttsSupported: typeof window !== "undefined" && "speechSynthesis" in window,

  /* Speech → text. Returns a controller with stop(); fires callbacks. */
  listen({ lang = "en", onResult, onEnd, onError }) {
    if (!Recognition) { onError?.(new Error("stt-unsupported")); return { stop() {} }; }
    const rec = new Recognition();
    rec.lang = SPEECH_LANGS[lang] || "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (e) => {
      let interim = "";
      for (const r of e.results) (r.isFinal ? (finalText += r[0].transcript) : (interim += r[0].transcript));
      onResult?.(finalText || interim, !!finalText);
    };
    rec.onerror = (e) => onError?.(new Error(e.error));
    rec.onend = () => onEnd?.(finalText);
    rec.start();
    return { stop: () => rec.stop() };
  },

  /* Text → speech in the app language. */
  speak(text, lang = "en") {
    if (!this.ttsSupported) return false;
    const target = SPEECH_LANGS[lang] || "en-IN";
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = target;
    const match = speechSynthesis.getVoices().find((v) => v.lang === target)
      || speechSynthesis.getVoices().find((v) => v.lang.startsWith(target.slice(0, 2)));
    if (match) utter.voice = match;
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
    return true;
  },

  stopSpeaking() { if (this.ttsSupported) speechSynthesis.cancel(); },
};
