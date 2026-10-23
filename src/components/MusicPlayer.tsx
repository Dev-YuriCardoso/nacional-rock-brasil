import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Music } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";

function formatTime(ms: number): string {
  if (!ms || ms <= 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function MusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    progress,
    currentTime,
    duration,
    volume,
    toggle,
    seekTo,
    setVolumeTo,
    skipNext,
    skipPrev,
  } = usePlayer();

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    seekTo(Math.max(0, Math.min(100, pct)));
  };

  const handleVolume = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setVolumeTo(Math.max(0, Math.min(100, pct)));
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center border-t border-border bg-player px-4">
      {/* Track Info */}
      <div className="flex items-center gap-3 w-1/4 min-w-0">
        {currentTrack?.artworkUrl ? (
          <img
            src={currentTrack.artworkUrl}
            alt="Album"
            className="h-12 w-12 rounded object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
            <Music className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {currentTrack?.title || "Nenhuma faixa"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {currentTrack?.artist || "—"}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-1 flex-col items-center gap-1">
        <div className="flex items-center gap-4">
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Shuffle className="h-4 w-4" />
          </button>
          <button onClick={skipPrev} className="text-foreground hover:text-primary transition-colors">
            <SkipBack className="h-5 w-5" />
          </button>
          <button
            onClick={toggle}
            className="flex h-9 w-9 items-center justify-center rounded-full gradient-rock text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>
          <button onClick={skipNext} className="text-foreground hover:text-primary transition-colors">
            <SkipForward className="h-5 w-5" />
          </button>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Repeat className="h-4 w-4" />
          </button>
        </div>
        <div className="flex w-full max-w-md items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-8 text-right">
            {formatTime(currentTime)}
          </span>
          <div
            className="relative h-1 flex-1 rounded-full bg-secondary cursor-pointer group"
            onClick={handleSeek}
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${progress}%`, transform: `translate(-50%, -50%)` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground w-8">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume */}
      <div className="hidden sm:flex items-center gap-2 w-1/4 justify-end">
        <button onClick={() => setVolumeTo(volume > 0 ? 0 : 75)} className="text-muted-foreground hover:text-foreground transition-colors">
          {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <div
          className="relative h-1 w-24 rounded-full bg-secondary cursor-pointer"
          onClick={handleVolume}
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-foreground"
            style={{ width: `${volume}%` }}
          />
        </div>
      </div>
    </footer>
  );
}
