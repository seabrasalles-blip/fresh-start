import { useEffect, useState } from "react";
import { Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function usePtVoice() {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const pick = () => {
      let v: SpeechSynthesisVoice[] = [];
      try { v = window.speechSynthesis.getVoices(); } catch { v = []; }
      setVoice(v.find((x) => x.lang === "pt-BR") ?? v.find((x) => x.lang.startsWith("pt")) ?? null);
    };
    pick();
    window.speechSynthesis.addEventListener("voiceschanged", pick);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", pick);
      window.speechSynthesis.cancel();
    };
  }, []);
  return voice;
}

/** Áudio opcional: só aparece se houver voz em português disponível; nunca toca sozinho. */
export function SpeakButton({ text }: { text: string }) {
  const voice = usePtVoice();
  const [speaking, setSpeaking] = useState(false);
  // troca de pista ou saída da tela: para a fala e volta o botão a "Ouvir"
  useEffect(() => () => { try { window.speechSynthesis?.cancel(); } catch { /* sem síntese */ } setSpeaking(false); }, [text]);
  if (!voice) return null;
  const toggle = () => {
    const s = window.speechSynthesis;
    if (speaking) { s.cancel(); setSpeaking(false); return; }
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice; u.lang = voice.lang; u.rate = 0.95;
      u.onend = () => setSpeaking(false);
      // erro ou interrupção (outra fala, sistema, aba em segundo plano): só volta ao estado inicial
      u.onerror = () => setSpeaking(false);
      s.cancel(); s.speak(u); setSpeaking(true);
    } catch {
      setSpeaking(false);
    }
  };
  return (
    <Button variant="gameSoft" size="game" onClick={toggle} aria-pressed={speaking}>
      {speaking ? <Square /> : <Volume2 />} {speaking ? "Parar" : "Ouvir"}
    </Button>
  );
}
