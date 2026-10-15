"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { LANGUAGES, type Lang } from "@/lib/i18n";
import { useApp } from "./AppState";

const noop = () => () => {};
const speechSupported = () => "speechSynthesis" in window;

/**
 * Reads text with the browser's own speech engine in the current language. No audio leaves the device.
 * Give it a `key` tied to the text so a new screen starts silent.
 */
export function ReadAloud({ text, lang: textLang }: { text: string; lang?: Lang }) {
  const { lang: uiLang, region, t } = useApp();
  const lang = textLang ?? uiLang;
  const supported = useSyncExternalStore(noop, speechSupported, () => false);
  const [speaking, setSpeaking] = useState(false);

  // Stop talking when this screen goes away.
  useEffect(() => () => {
    if (speechSupported()) window.speechSynthesis.cancel();
  }, []);

  if (!supported) return null;

  function toggle() {
    const synth = window.speechSynthesis;
    synth.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = region && !textLang ? `${LANGUAGES[lang].bcp47}-${region.id}` : LANGUAGES[lang].bcp47;
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    synth.speak(utterance);
    setSpeaking(true);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={speaking}
      className="inline-flex items-center gap-2 rounded-sign border-2 border-panel-strong px-3 py-1.5 text-sm font-bold text-ink-2 hover:border-ink hover:text-ink"
    >
      {speaking ? <VolumeX aria-hidden="true" size={18} /> : <Volume2 aria-hidden="true" size={18} />}
      {speaking ? t("nav.stopReading") : t("nav.readAloud")}
    </button>
  );
}
