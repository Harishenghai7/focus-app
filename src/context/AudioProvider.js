import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';

const SOUND_MAP = {
  like: '/sounds/pop.mp3',
  send: '/sounds/swoosh.mp3',
  notification: '/sounds/tick.mp3',
};

const AudioContext = createContext({
  play: () => {},
});

export const AudioProvider = ({ children }) => {
  const cacheRef = useRef(new Map());

  const getAudio = useCallback((key) => {
    const src = SOUND_MAP[key];
    if (!src) return null;
    if (!cacheRef.current.has(key)) {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.volume = 0.45;
      cacheRef.current.set(key, audio);
    }
    return cacheRef.current.get(key);
  }, []);

  const play = useCallback((key) => {
    const instance = getAudio(key);
    if (!instance) return;
    instance.currentTime = 0;
    instance.play().catch(() => {});
  }, [getAudio]);

  const value = useMemo(() => ({ play }), [play]);
  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

export const useAudio = () => useContext(AudioContext);
export const useFocusAudio = () => useContext(AudioContext);
