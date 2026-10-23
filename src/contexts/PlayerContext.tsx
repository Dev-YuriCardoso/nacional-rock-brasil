import { createContext, useContext, useState, useCallback, useRef, ReactNode } from "react";

export interface TrackInfo {
  title: string;
  artist: string;
  artworkUrl: string | null;
}

interface PlayerContextType {
  currentTrack: TrackInfo | null;
  isPlaying: boolean;
  progress: number; // 0–100
  currentTime: number; // ms
  duration: number; // ms
  volume: number; // 0–100
  widgetRef: React.MutableRefObject<any | null>;
  setCurrentTrack: (t: TrackInfo | null) => void;
  setIsPlaying: (v: boolean) => void;
  setProgress: (v: number) => void;
  setCurrentTime: (v: number) => void;
  setDuration: (v: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seekTo: (pct: number) => void;
  setVolumeTo: (v: number) => void;
  skipNext: () => void;
  skipPrev: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(75);
  const widgetRef = useRef<any>(null);

  const play = useCallback(() => {
    widgetRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    widgetRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    widgetRef.current?.toggle();
  }, []);

  const seekTo = useCallback((pct: number) => {
    if (widgetRef.current && duration > 0) {
      widgetRef.current.seekTo((pct / 100) * duration);
    }
  }, [duration]);

  const setVolumeTo = useCallback((v: number) => {
    setVolume(v);
    widgetRef.current?.setVolume(v);
  }, []);

  const skipNext = useCallback(() => {
    widgetRef.current?.next();
  }, []);

  const skipPrev = useCallback(() => {
    widgetRef.current?.prev();
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        progress,
        currentTime,
        duration,
        volume,
        widgetRef,
        setCurrentTrack,
        setIsPlaying,
        setProgress,
        setCurrentTime,
        setDuration,
        play,
        pause,
        toggle,
        seekTo,
        setVolumeTo,
        skipNext,
        skipPrev,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
