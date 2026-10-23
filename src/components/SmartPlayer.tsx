import { useState, useEffect, useRef, useCallback } from "react";
import { Music, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePlayer } from "@/contexts/PlayerContext";
import type { EmbedType } from "@/lib/embedUtils";

interface SmartPlayerProps {
  type: EmbedType;
  embedUrl: string;
  title: string;
  artistName?: string;
}

// Load SoundCloud Widget API once
let scApiLoaded = false;
let scApiPromise: Promise<void> | null = null;
function loadSCWidgetAPI(): Promise<void> {
  if (scApiLoaded) return Promise.resolve();
  if (scApiPromise) return scApiPromise;
  scApiPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://w.soundcloud.com/player/api.js";
    script.onload = () => { scApiLoaded = true; resolve(); };
    document.head.appendChild(script);
  });
  return scApiPromise;
}

export function SmartPlayer({ type, embedUrl, title, artistName }: SmartPlayerProps) {
  const [bandcampEmbedUrl, setBandcampEmbedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(type === "bandcamp");
  const [error, setError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const player = usePlayer();

  useEffect(() => {
    if (type !== "bandcamp") return;
    resolveBandcamp(embedUrl);
  }, [type, embedUrl]);

  // Connect SoundCloud widget to global player
  useEffect(() => {
    if (type !== "soundcloud" || !iframeRef.current) return;
    let widget: any = null;

    const setup = async () => {
      await loadSCWidgetAPI();
      const SC = (window as any).SC;
      if (!SC?.Widget || !iframeRef.current) return;
      widget = SC.Widget(iframeRef.current);

      widget.bind(SC.Widget.Events.PLAY, () => {
        player.setIsPlaying(true);
        player.widgetRef.current = widget;
        widget.getCurrentSound((sound: any) => {
          player.setCurrentTrack({
            title: sound?.title || title,
            artist: sound?.user?.username || artistName || "SoundCloud",
            artworkUrl: sound?.artwork_url?.replace("-large", "-t300x300") || null,
          });
        });
        widget.getDuration((d: number) => player.setDuration(d));
      });

      widget.bind(SC.Widget.Events.PAUSE, () => {
        player.setIsPlaying(false);
      });

      widget.bind(SC.Widget.Events.FINISH, () => {
        player.setIsPlaying(false);
        player.setProgress(100);
      });

      widget.bind(SC.Widget.Events.PLAY_PROGRESS, (e: any) => {
        player.setCurrentTime(e.currentPosition);
        player.setProgress(e.relativePosition * 100);
      });
    };

    setup();

    return () => {
      // Don't unbind — widget may still be the active player
    };
  }, [type, title, artistName]);

  const resolveBandcamp = async (url: string) => {
    setLoading(true);
    setError(false);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("resolve-bandcamp", {
        body: { url },
      });
      if (fnError || !data?.embedUrl) {
        setError(true);
      } else {
        setBandcampEmbedUrl(data.embedUrl);
      }
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  if (type === "spotify") {
    return (
      <iframe
        src={embedUrl}
        width="100%"
        height="80"
        allow="encrypted-media"
        className="border-0"
        title={title}
      />
    );
  }

  if (type === "youtube") {
    return (
      <div className="aspect-video">
        <iframe
          className="w-full h-full"
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (type === "soundcloud") {
    return (
      <iframe
        ref={iframeRef}
        width="100%"
        height="166"
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        src={embedUrl}
        title={title}
        className="border-0"
      />
    );
  }

  if (type === "bandcamp") {
    if (loading) {
      return (
        <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Carregando player...</span>
        </div>
      );
    }
    if (error || !bandcampEmbedUrl) {
      return (
        <div className="flex items-center justify-center gap-2 py-6">
          <Music className="h-4 w-4 text-muted-foreground" />
          <a href={embedUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
            Ouvir no Bandcamp
          </a>
        </div>
      );
    }
    return (
      <iframe
        src={bandcampEmbedUrl}
        width="100%"
        height="120"
        seamless
        className="border-0"
        title={title}
      />
    );
  }

  return null;
}
