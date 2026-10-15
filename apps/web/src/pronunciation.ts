export interface PronunciationRequest {
  word: string;
  audioUrl?: string;
  locale?: string;
  childAge?: number;
}

export interface PronunciationResult {
  source: "asset" | "speech-synthesis" | "unavailable";
}

let activeAudio: HTMLAudioElement | null = null;

export async function pronounceWord(request: PronunciationRequest): Promise<PronunciationResult> {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio = null;
  }
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();

  if (request.audioUrl) {
    try {
      const audio = new Audio(request.audioUrl);
      activeAudio = audio;
      await audio.play();
      return { source: "asset" };
    } catch {
      activeAudio = null;
      // Continue to the local browser fallback rather than blocking learning.
    }
  }

  if (!("speechSynthesis" in window)) return { source: "unavailable" };

  const utterance = new SpeechSynthesisUtterance(request.word.toLocaleLowerCase("es"));
  utterance.lang = request.locale ?? "es-419";
  utterance.rate = request.childAge !== undefined && request.childAge <= 5 ? 0.72 : 0.82;
  window.speechSynthesis.speak(utterance);
  return { source: "speech-synthesis" };
}

export function stopPronunciation() {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio = null;
  }
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}
