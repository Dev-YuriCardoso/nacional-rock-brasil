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
    currentTrack, isPlaying, progress, currentTime, duration, volume,
    toggle, seekTo, setVolumeTo, skipNext, skipPrev,
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
    <>
      {currentTrack && (
        <div className="fixed inset-x-2 bottom-[calc(60px+env(safe-area-inset-bottom))] z-40 overflow-hidden rounded-xl border border-border bg-card/95 shadow-2xl backdrop-blur-xl md:hidden">
          <div className="flex h-[58px] items-center gap-2.5 px-2.5">
            {currentTrack.artworkUrl ? (
              <img src={currentTrack.artworkUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Music className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">{currentTrack.title}</p>
              <p className="truncate text-[10px] text-muted-foreground">{currentTrack.artist}</p>
            </div>
            <button onClick={skipPrev} aria-label="Faixa anterior" className="flex h-9 w-8 items-center justify-center text-muted-foreground">
              <SkipBack className="h-4 w-4" />
            </button>
            <button onClick={toggle} aria-label={isPlaying ? "Pausar" : "Reproduzir"} className="flex h-10 w-10 items-center justify-center rounded-full gradient-rock text-primary-foreground">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
            </button>
            <button onClick={skipNext} aria-label="Próxima faixa" className="flex h-9 w-8 items-center justify-center text-muted-foreground">
              <SkipForward className="h-4 w-4" />
            </button>
          </div>
          <div className="h-0.5 w-full bg-secondary">
            <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <footer className="fixed bottom-0 left-16 right-0 z-50 hidden h-20 items-center border-t border-border bg-player px-4 md:flex lg:left-60">
        <div className="flex w-1/4 min-w-0 items-center gap-3">
          {currentTrack?.artworkUrl ? (
            <img src={currentTrack.artworkUrl} alt="" className="h-12 w-12 rounded object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
              <Music className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{currentTrack?.title || "Nenhuma faixa"}</p>
            <p className="truncate text-xs text-muted-foreground">{currentTrack?.artist || "—"}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center gap-1">
          <div className="flex items-center gap-4">
            <button aria-label="Aleatório" className="text-muted-foreground hover:text-foreground"><Shuffle className="h-4 w-4" /></button>
            <button onClick={skipPrev} aria-label="Faixa anterior" className="text-foreground hover:text-primary"><SkipBack className="h-5 w-5" /></button>
            <button onClick={toggle} aria-label={isPlaying ? "Pausar" : "Reproduzir"} className="flex h-9 w-9 items-center justify-center rounded-full gradient-rock text-primary-foreground hover:opacity-90">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
            </button>
            <button onClick={skipNext} aria-label="Próxima faixa" className="text-foreground hover:text-primary"><SkipForward className="h-5 w-5" /></button>
            <button aria-label="Repetir" className="text-muted-foreground hover:text-foreground"><Repeat className="h-4 w-4" /></button>
          </div>
          <div className="flex w-full max-w-md items-center gap-2">
            <span className="w-8 text-right text-[10px] text-muted-foreground">{formatTime(currentTime)}</span>
            <div
              role="slider"
              aria-label="Progresso da faixa"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowUp") seekTo(Math.min(100, progress + 5));
                else if (event.key === "ArrowLeft" || event.key === "ArrowDown") seekTo(Math.max(0, progress - 5));
                else if (event.key === "Home") seekTo(0);
                else if (event.key === "End") seekTo(100);
                else return;
                event.preventDefault();
              }}
              className="group relative h-1 flex-1 cursor-pointer rounded-full bg-secondary outline-offset-4 focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary"
              onClick={handleSeek}
            >
              <div className="absolute left-0 top-0 h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              <div className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-foreground opacity-0 transition-opacity group-hover:opacity-100" style={{ left: `${progress}%`, transform: "translate(-50%, -50%)" }} />
            </div>
            <span className="w-8 text-[10px] text-muted-foreground">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="hidden w-1/4 items-center justify-end gap-2 sm:flex">
          <button onClick={() => setVolumeTo(volume > 0 ? 0 : 75)} aria-label={volume === 0 ? "Ativar volume" : "Silenciar"} className="text-muted-foreground hover:text-foreground">
            {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <div
            role="slider"
            aria-label="Volume"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={volume}
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowUp") setVolumeTo(Math.min(100, volume + 5));
              else if (event.key === "ArrowLeft" || event.key === "ArrowDown") setVolumeTo(Math.max(0, volume - 5));
              else if (event.key === "Home") setVolumeTo(0);
              else if (event.key === "End") setVolumeTo(100);
              else return;
              event.preventDefault();
            }}
            className="relative h-1 w-24 cursor-pointer rounded-full bg-secondary outline-offset-4 focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary"
            onClick={handleVolume}
          >
            <div className="absolute left-0 top-0 h-full rounded-full bg-foreground" style={{ width: `${volume}%` }} />
          </div>
        </div>
      </footer>
    </>
  );
}
