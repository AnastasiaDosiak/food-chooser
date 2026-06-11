import { useCallback, useEffect, useRef } from 'react';

const TICK_THROTTLE_MS = 25;
const FANFARE_NOTES_HZ = [523.25, 659.25, 783.99, 1046.5];
/** Bb3 → A3 → Ab3 → F#3: womp, womp, womp, wooomp. */
const TROMBONE_NOTES_HZ = [233.08, 220, 207.65, 185];
/** C2/G2 alternating walking bass for the oompah loop. */
const OOMPAH_BASS_HZ = [65.41, 98];
const SPIN_LOOP_LOOKAHEAD_S = 0.15;
const SPIN_LOOP_TIMER_MS = 40;

/** All casino noise synthesized at runtime — zero audio files, survives dead wifi. */
export const useCasinoAudio = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const lastTickAtRef = useRef(0);
  const spinLoopTimerRef = useRef<number | null>(null);
  const nextBeatTimeRef = useRef(0);
  const beatIndexRef = useRef(0);
  const wheelSpeedRef = useRef(0);

  /** Must be called from a user gesture (browsers block audio before one). */
  const primeAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === 'suspended') {
      void audioContextRef.current.resume();
    }
  }, []);

  const getRunningContext = useCallback(() => {
    const audioContext = audioContextRef.current;
    return audioContext && audioContext.state === 'running' ? audioContext : null;
  }, []);

  const getNoiseBuffer = useCallback((audioContext: AudioContext) => {
    if (!noiseBufferRef.current) {
      const buffer = audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate);
      const channel = buffer.getChannelData(0);
      for (let sampleIndex = 0; sampleIndex < channel.length; sampleIndex += 1) {
        channel[sampleIndex] = Math.random() * 2 - 1;
      }
      noiseBufferRef.current = buffer;
    }
    return noiseBufferRef.current;
  }, []);

  const playTick = useCallback(() => {
    const audioContext = getRunningContext();
    if (!audioContext) {
      return;
    }
    const now = performance.now();
    if (now - lastTickAtRef.current < TICK_THROTTLE_MS) {
      return;
    }
    lastTickAtRef.current = now;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = 1900 + Math.random() * 250;
    gain.gain.setValueAtTime(0.05, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.05);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.06);
  }, [getRunningContext]);

  const playFanfare = useCallback(() => {
    const audioContext = getRunningContext();
    if (!audioContext) {
      return;
    }
    FANFARE_NOTES_HZ.forEach((frequency, noteIndex) => {
      const startAt = audioContext.currentTime + noteIndex * 0.09;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.12, startAt);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.22);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + 0.25);
    });
  }, [getRunningContext]);

  const playTrombone = useCallback(() => {
    const audioContext = getRunningContext();
    if (!audioContext) {
      return;
    }
    let noteStart = audioContext.currentTime + 0.02;
    TROMBONE_NOTES_HZ.forEach((frequency, noteIndex) => {
      const isFinalWomp = noteIndex === TROMBONE_NOTES_HZ.length - 1;
      const noteLength = isFinalWomp ? 0.7 : 0.26;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(frequency, noteStart);
      oscillator.frequency.linearRampToValueAtTime(
        frequency * (isFinalWomp ? 0.86 : 0.95),
        noteStart + noteLength,
      );
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.09, noteStart + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + noteLength);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteStart + noteLength + 0.05);
      noteStart += isFinalWomp ? noteLength : noteLength + 0.05;
    });
  }, [getRunningContext]);

  /** Fire fwoosh + crackle for burning the ledger. */
  const playFireFwoosh = useCallback(() => {
    const audioContext = getRunningContext();
    if (!audioContext) {
      return;
    }
    const startAt = audioContext.currentTime;

    const fwoosh = audioContext.createBufferSource();
    fwoosh.buffer = getNoiseBuffer(audioContext);
    const fwooshFilter = audioContext.createBiquadFilter();
    fwooshFilter.type = 'bandpass';
    fwooshFilter.Q.value = 0.8;
    fwooshFilter.frequency.setValueAtTime(950, startAt);
    fwooshFilter.frequency.exponentialRampToValueAtTime(220, startAt + 1.1);
    const fwooshGain = audioContext.createGain();
    fwooshGain.gain.setValueAtTime(0.0001, startAt);
    fwooshGain.gain.exponentialRampToValueAtTime(0.22, startAt + 0.12);
    fwooshGain.gain.exponentialRampToValueAtTime(0.0001, startAt + 1.3);
    fwoosh.connect(fwooshFilter).connect(fwooshGain).connect(audioContext.destination);
    fwoosh.start(startAt);
    fwoosh.stop(startAt + 1.35);

    for (let crackleIndex = 0; crackleIndex < 7; crackleIndex += 1) {
      const crackleAt = startAt + 0.1 + Math.random() * 0.9;
      const crackle = audioContext.createBufferSource();
      crackle.buffer = getNoiseBuffer(audioContext);
      const crackleFilter = audioContext.createBiquadFilter();
      crackleFilter.type = 'highpass';
      crackleFilter.frequency.value = 2400;
      const crackleGain = audioContext.createGain();
      crackleGain.gain.setValueAtTime(0.05 + Math.random() * 0.06, crackleAt);
      crackleGain.gain.exponentialRampToValueAtTime(0.0001, crackleAt + 0.035);
      crackle.connect(crackleFilter).connect(crackleGain).connect(audioContext.destination);
      crackle.start(crackleAt);
      crackle.stop(crackleAt + 0.04);
    }
  }, [getRunningContext, getNoiseBuffer]);

  /** Music tempo follows the wheel — feed it |deg/ms| every animation frame. */
  const setWheelSpeed = useCallback((speedDegPerMs: number) => {
    wheelSpeedRef.current = Math.abs(speedDegPerMs);
  }, []);

  const scheduleOompahBeat = useCallback(
    (audioContext: AudioContext, beatAt: number, beatIndex: number) => {
      if (beatIndex % 2 === 0) {
        const bass = audioContext.createOscillator();
        const bassGain = audioContext.createGain();
        bass.type = 'triangle';
        bass.frequency.value = OOMPAH_BASS_HZ[(beatIndex >> 1) % OOMPAH_BASS_HZ.length];
        bassGain.gain.setValueAtTime(0.14, beatAt);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, beatAt + 0.13);
        bass.connect(bassGain).connect(audioContext.destination);
        bass.start(beatAt);
        bass.stop(beatAt + 0.15);
        return;
      }
      const hat = audioContext.createBufferSource();
      hat.buffer = getNoiseBuffer(audioContext);
      const hatFilter = audioContext.createBiquadFilter();
      hatFilter.type = 'highpass';
      hatFilter.frequency.value = 6000;
      const hatGain = audioContext.createGain();
      hatGain.gain.setValueAtTime(0.04, beatAt);
      hatGain.gain.exponentialRampToValueAtTime(0.0001, beatAt + 0.04);
      hat.connect(hatFilter).connect(hatGain).connect(audioContext.destination);
      hat.start(beatAt);
      hat.stop(beatAt + 0.05);
    },
    [getNoiseBuffer],
  );

  const stopSpinLoop = useCallback(() => {
    if (spinLoopTimerRef.current !== null) {
      window.clearInterval(spinLoopTimerRef.current);
      spinLoopTimerRef.current = null;
    }
  }, []);

  /** Goofy oompah loop; eighth-note pace stretches as the wheel dies down. */
  const startSpinLoop = useCallback(() => {
    const audioContext = getRunningContext();
    if (!audioContext || spinLoopTimerRef.current !== null) {
      return;
    }
    nextBeatTimeRef.current = audioContext.currentTime + 0.06;
    beatIndexRef.current = 0;
    spinLoopTimerRef.current = window.setInterval(() => {
      const runningContext = getRunningContext();
      if (!runningContext) {
        return;
      }
      while (nextBeatTimeRef.current < runningContext.currentTime + SPIN_LOOP_LOOKAHEAD_S) {
        scheduleOompahBeat(runningContext, nextBeatTimeRef.current, beatIndexRef.current);
        const beatsPerMinute = Math.min(Math.max(80 + wheelSpeedRef.current * 160, 64), 290);
        nextBeatTimeRef.current += 30 / beatsPerMinute;
        beatIndexRef.current += 1;
      }
    }, SPIN_LOOP_TIMER_MS);
  }, [getRunningContext, scheduleOompahBeat]);

  useEffect(
    () => () => {
      stopSpinLoop();
      void audioContextRef.current?.close();
      audioContextRef.current = null;
      noiseBufferRef.current = null;
    },
    [stopSpinLoop],
  );

  return {
    primeAudio,
    playTick,
    playFanfare,
    playTrombone,
    playFireFwoosh,
    setWheelSpeed,
    startSpinLoop,
    stopSpinLoop,
  };
};
