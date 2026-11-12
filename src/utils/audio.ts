// Web Audio API Chime & Speech Synthesis for Canteen Queue with bulletproof safety

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {
        // Ignored if user hasn't interacted with page yet
      });
    }
    return audioCtx;
  } catch (err) {
    console.warn('AudioContext initialization warning:', err);
    return null;
  }
}

/**
 * Plays a bright, pleasant 2-tone chime (ding-dong counter chime)
 */
export function playChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) {
        return resolve();
      }

      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Note 2: C5 (523.25 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25, now + 0.35);
      gain2.gain.setValueAtTime(0, now + 0.35);
      gain2.gain.linearRampToValueAtTime(0.35, now + 0.4);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.35);
      osc2.stop(now + 1.2);

      setTimeout(() => {
        resolve();
      }, 900);
    } catch (e) {
      console.warn('Audio chime warning:', e);
      resolve();
    }
  });
}

/**
 * Formats queue number for smooth Indonesian speech synthesis
 * e.g. "A025" -> "A kosong dua lima"
 */
export function formatNumberForSpeech(numStr: string): string {
  const digits: Record<string, string> = {
    '0': 'kosong',
    '1': 'satu',
    '2': 'dua',
    '3': 'tiga',
    '4': 'empat',
    '5': 'lima',
    '6': 'enam',
    '7': 'tujuh',
    '8': 'delapan',
    '9': 'sembilan',
  };

  const clean = numStr.trim().toUpperCase();
  const parts: string[] = [];

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (char >= '0' && char <= '9') {
      parts.push(digits[char]);
    } else {
      parts.push(char);
    }
  }

  return parts.join(' ');
}

/**
 * Speaks the queue announcement safely
 * "Nomor A025, atas nama Ahmad, silakan maju."
 */
export async function announceQueue(
  queueNumber: string,
  name: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  try {
    // Attempt chime without throwing
    await playChime().catch(() => {});

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onStart) onStart();
      setTimeout(() => {
        if (onEnd) onEnd();
      }, 1500);
      return;
    }

    // Cancel any ongoing speech
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignored
    }

    const spokenNumber = formatNumberForSpeech(queueNumber);
    const text = `Nomor ${spokenNumber}, atas nama ${name}, silakan maju ke kasir.`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    // Try finding Indonesian voice if available
    try {
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(
        (v) => v.lang.toLowerCase().includes('id') || v.lang.toLowerCase().includes('ind')
      );
      if (idVoice) {
        utterance.voice = idVoice;
      }
    } catch {
      // Ignored
    }

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis notice:', e);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech announcement warning:', err);
    if (onEnd) onEnd();
  }
}
