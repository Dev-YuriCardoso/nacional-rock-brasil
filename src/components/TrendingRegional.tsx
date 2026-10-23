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
    if (detectedState) loadTrending();
    else setLoading(false);
  }, [detectedState]);

  const loadTrending = async () => {
    // Get bands from user's state
    const { data: stateBands } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, genre")
      .eq("user_type", "banda")
      .eq("is_suspended", false)
      .eq("estado", detectedState);

    if (!stateBands || stateBands.length === 0) {
      setLoading(false);
      return;
    }

    const bandIds = stateBands.map((b) => b.id);
    const oneWeekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

    // Count new followers in the last week
    const { data: recentFollows } = await supabase
      .from("follows")
      .select("following_id")
      .in("following_id", bandIds)
      .gte("created_at", oneWeekAgo);

    const countMap: Record<string, number> = {};
    (recentFollows || []).forEach((f) => {
      countMap[f.following_id] = (countMap[f.following_id] || 0) + 1;
    });

    const trending: TrendingBand[] = stateBands
      .map((b) => ({ ...b, new_followers: countMap[b.id] || 0 }))
      .filter((b) => b.new_followers > 0)
      .sort((a, b) => b.new_followers - a.new_followers)
      .slice(0, 6);

    setBands(trending);
    setLoading(false);
  };

  if (!detectedState || loading || bands.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="font-display text-2xl md:text-3xl text-foreground">
            BOMBANDO NO {detectedState}
          </h2>
        </div>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          Última semana
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {bands.map((band) => (
          <Link key={band.id} to={`/artista/${band.id}`} className="group text-center">
            <div className="aspect-square overflow-hidden rounded-lg mb-2 bg-card relative">
              {band.avatar_url ? (
                <img src={band.avatar_url} alt={band.username} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              ) : (
                <div className="h-full w-full gradient-rock flex items-center justify-center">
                  <span className="font-display text-4xl text-primary-foreground">{band.username[0]?.toUpperCase()}</span>
                </div>
              )}
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                +{band.new_followers}
              </span>
            </div>
            <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{band.username}</h3>
            {band.genre && <p className="text-xs text-muted-foreground">{band.genre}</p>}
          </Link>
        ))}
      </div>
    </section>
  );
}
