import { useState, useEffect } from "react";
import { TrendingUp, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useGeo } from "@/contexts/GeoContext";

interface TrendingBand {
  id: string;
  username: string;
  avatar_url: string | null;
  genre: string | null;
  new_followers: number;
}

export function TrendingRegional() {
  const { detectedState } = useGeo();
  const [bands, setBands] = useState<TrendingBand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadTrending = async () => {
      if (!detectedState) {
        setBands([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data: stateBands } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, genre")
        .eq("user_type", "banda")
        .eq("is_suspended", false)
        .eq("estado", detectedState);

      if (cancelled) return;
      if (!stateBands?.length) {
        setBands([]);
        setLoading(false);
        return;
      }

      const bandIds = stateBands.map((band) => band.id);
      const oneWeekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data: recentFollows } = await supabase
        .from("follows")
        .select("following_id")
        .in("following_id", bandIds)
        .gte("created_at", oneWeekAgo);

      if (cancelled) return;
      const countMap: Record<string, number> = {};
      (recentFollows || []).forEach((follow) => {
        countMap[follow.following_id] = (countMap[follow.following_id] || 0) + 1;
      });

      setBands(stateBands
        .map((band) => ({ ...band, new_followers: countMap[band.id] || 0 }))
        .filter((band) => band.new_followers > 0)
        .sort((a, b) => b.new_followers - a.new_followers)
        .slice(0, 6));
      setLoading(false);
    };

    loadTrending();
    return () => { cancelled = true; };
  }, [detectedState]);

  if (!detectedState || loading || bands.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Sua região</p>
          <h2 className="mt-0.5 flex items-center gap-2 font-display text-xl text-foreground sm:text-2xl">
            <TrendingUp className="h-5 w-5 text-primary" /> BOMBANDO NO {detectedState}
          </h2>
        </div>
        <span className="mb-1 flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground sm:text-xs">
          <MapPin className="h-3 w-3" /> 7 dias
        </span>
      </div>
      <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 md:grid-cols-6">
        {bands.map((band) => (
          <Link key={band.id} to={"/artista/" + band.id} className="group w-[112px] shrink-0 snap-start text-left sm:w-auto sm:text-center">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-card">
              {band.avatar_url ? (
                <img src={band.avatar_url} alt={band.username} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <div className="flex h-full w-full items-center justify-center gradient-rock">
                  <span className="font-display text-3xl text-primary-foreground">{band.username[0]?.toUpperCase()}</span>
                </div>
              )}
              <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground">+{band.new_followers}</span>
            </div>
            <h3 className="mt-2 truncate text-xs font-semibold text-foreground group-hover:text-primary sm:text-sm">{band.username}</h3>
            <p className="truncate text-[10px] text-muted-foreground sm:text-xs">{band.genre || "Rock"}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
