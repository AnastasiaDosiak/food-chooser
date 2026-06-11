import { useCallback, useEffect, useRef } from 'react';

const BOING_START_HZ = 240;
const BOING_PEAK_HZ = 1100;
const BOING_DURATION_S = 0.4;
const BOING_GAIN = 0.16;

export const TRUMP_PHRASES = [
  'no, I love it',
  'I fucking love it',
  'nice choice, folks',
  'tremendous, just tremendous',
  "believe me, it's the best",
  'a fantastic choice, the best',
  'nobody picks dinner better than you',
  "that's a beautiful choice, beautiful",
  'huge — this one is gonna be huge',
  "you're gonna eat so well",
  'the wheel knows, the wheel always knows',
  'winner winner, you get dinner',
  'the best dinner, maybe ever',
  'ten outta ten, no notes',
  "frankly, it's delicious",
  "so good it's almost illegal",
  'chef kiss, tremendous',
  'the fake news will hate this one',
  'we love this restaurant, we love it',
  'big flavor, very big, the biggest',
] as const;

/** One random Trump line per pop. */
export const pickTrumpPhrase = (): string =>
  TRUMP_PHRASES[Math.floor(Math.random() * TRUMP_PHRASES.length)];

const SPOKEN_PITCH = 0.7;
const SPOKEN_RATE = 0.95;
// Deepest, most authoritative local male voice first — the closest match to the target on Windows.
const VOICE_PREFERENCE = [/david/i, /mark/i, /guy/i] as const;
const CLIP_VOLUME = 0.9;

// Drop the real clip at src/assets/trump-voice.(mp3|ogg|wav|m4a) — it auto-plays instead of the synth voice.
const VOICE_CLIP_URL = Object.values(
  import.meta.glob<string>('../assets/trump-voice.*', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
)[0];

const pickLocalVoice = (): SpeechSynthesisVoice | undefined => {
  const localEnglish = window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.localService && voice.lang.startsWith('en'));
  const preferred = VOICE_PREFERENCE.map((pattern) =>
    localEnglish.find((voice) => pattern.test(voice.name)),
  ).find(Boolean);
  return preferred ?? localEnglish[0] ?? window.speechSynthesis.getVoices()[0];
};

/** Toasty-pop audio: synth boing + the Trump line (bundled clip if present, else low-pitch synth voice). */
export const useToastySound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const clipRef = useRef<HTMLAudioElement | null>(null);

  const playToasty = useCallback((line: string) => {
    if (!audioContextRef.current) {
      // Created post-gesture (the flick already happened), so autoplay policy allows it.
      audioContextRef.current = new AudioContext();
    }
    const audioContext = audioContextRef.current;
    if (audioContext.state === 'suspended') {
      void audioContext.resume();
    }

    const startAt = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(BOING_START_HZ, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(BOING_PEAK_HZ, startAt + BOING_DURATION_S);
    gain.gain.setValueAtTime(BOING_GAIN, startAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + BOING_DURATION_S + 0.1);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + BOING_DURATION_S + 0.12);

    const speakLine = () => {
      if (!('speechSynthesis' in window)) {
        return;
      }
      // Local voices only — remote ones need network and the demo must survive wifi down.
      const voice = pickLocalVoice();
      if (!voice) {
        return;
      }
      const utterance = new SpeechSynthesisUtterance(line);
      utterance.voice = voice;
      utterance.pitch = SPOKEN_PITCH;
      utterance.rate = SPOKEN_RATE;
      window.speechSynthesis.speak(utterance);
    };

    if (VOICE_CLIP_URL) {
      clipRef.current = clipRef.current ?? new Audio(VOICE_CLIP_URL);
      clipRef.current.volume = CLIP_VOLUME;
      clipRef.current.currentTime = 0;
      clipRef.current.play().catch(speakLine);
      return;
    }
    speakLine();
  }, []);

  useEffect(
    () => () => {
      void audioContextRef.current?.close();
      audioContextRef.current = null;
      clipRef.current?.pause();
      clipRef.current = null;
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    },
    [],
  );

  return { playToasty };
};
