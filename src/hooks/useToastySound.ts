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

interface VoiceClip {
  caption: string;
  url: string;
}

// Recorded clips live in src/assets/voice/. Each filename stem maps to the bubble
// caption here, so the spoken line and the on-screen text always match. Add a clip
// (and its stem→caption entry) to grow the roster; drop them all to fall back to synth.
const VOICE_LINE_BY_STEM: Record<string, string> = {
  'believe-me-its-the-best': "believe me, it's the best",
  'tremendous-just-tremendous': 'tremendous, just tremendous',
};

const stemOf = (path: string): string => (path.split('/').pop() ?? path).replace(/\.[^.]+$/, '');

const VOICE_CLIPS: VoiceClip[] = Object.entries(
  import.meta.glob<string>('../assets/voice/*.{m4a,mp3,ogg,wav}', {
    eager: true,
    query: '?url',
    import: 'default',
  }),
).map(([path, url]) => {
  const stem = stemOf(path);
  return { caption: VOICE_LINE_BY_STEM[stem] ?? stem.replace(/-/g, ' '), url };
});

const hasVoiceClips = VOICE_CLIPS.length > 0;

/** A random pop line. With recorded clips present, only their captions are used so audio matches text. */
export const pickToastyLine = (): string => {
  const lines = hasVoiceClips ? VOICE_CLIPS.map((clip) => clip.caption) : TRUMP_PHRASES;
  return lines[Math.floor(Math.random() * lines.length)];
};

const SPOKEN_PITCH = 0.7;
const SPOKEN_RATE = 0.95;
// Deepest, most authoritative local male voice first — the fallback when no clip is recorded.
const VOICE_PREFERENCE = [/david/i, /mark/i, /guy/i] as const;
const CLIP_VOLUME = 0.9;

const pickLocalVoice = (): SpeechSynthesisVoice | undefined => {
  const localEnglish = window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.localService && voice.lang.startsWith('en'));
  const preferred = VOICE_PREFERENCE.map((pattern) =>
    localEnglish.find((voice) => pattern.test(voice.name)),
  ).find(Boolean);
  return preferred ?? localEnglish[0] ?? window.speechSynthesis.getVoices()[0];
};

/** Toasty-pop audio: synth boing + the line (your recorded clip if present, else a low-pitch synth voice). */
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

    const clip = VOICE_CLIPS.find((candidate) => candidate.caption === line);
    if (clip) {
      const audio = new Audio(clip.url);
      audio.volume = CLIP_VOLUME;
      clipRef.current = audio;
      audio.play().catch(speakLine);
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
