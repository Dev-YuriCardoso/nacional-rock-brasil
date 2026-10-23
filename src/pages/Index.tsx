import { useState, useEffect } from "react";
import { Play, Calendar, TrendingUp, Users, Music } from "lucide-react";
import { Link } from "react-router-dom";
import { HeroCarousel } from "@/components/HeroCarousel";
import { TrendingRegional } from "@/components/TrendingRegional";
import { supabase } from "@/integrations/supabase/client";

interface Artist {
  id: string;
  username: string;
  avatar_url: string | null;
  genre: string | null;
}

interface ContentItem {
  id: string;
  title: string;
  url: string;
  type: string;
  created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
}

interface EventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  city: string;
  profiles: { username: string; avatar_url: string | null } | null;
}

const Index = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [newContent, setNewContent] = useState<ContentItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    const [artistsRes, contentRes, eventsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, avatar_url, genre")
        .eq("user_type", "banda")
        .eq("is_suspended", false)
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("content")
        .select("id, title, url, type, created_at, profiles(username, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("events")
        .select("id, title, date, location, city, profiles(username, avatar_url)")
        .gte("date", new Date().toISOString())
        .order("date", { ascending: true })
        .limit(3),
    ]);

    setArtists(artistsRes.data || []);
    setNewContent((contentRes.data as any) || []);
    setEvents((eventsRes.data as any) || []);
    setLoading(false);
  };

  const spotifyContent = newContent.filter((c) => c.type === "spotify_link");
  const youtubeContent = newContent.filter((c) => c.type === "youtube_link");

  return (
    <div className="p-4 md:p-8 space-y-12">
      <HeroCarousel />

      {/* Trending Regional */}
      <TrendingRegional />

      {/* New Releases (latest content) */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl md:text-3xl text-foreground">NOVOS LANÇAMENTOS</h2>
          </div>
          <Link to="/artistas" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Ver todos →
          </Link>
        </div>
        {newContent.length === 0 && !loading ? (
          <p className="text-muted-foreground text-center py-8">Nenhum lançamento ainda.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {newContent.map((item) => {
              const profile = item.profiles as any;
              return (
                <div key={item.id} className="group cursor-pointer">
                  <div className="relative aspect-square overflow-hidden rounded-lg mb-2 bg-card">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={item.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="h-full w-full gradient-rock flex items-center justify-center">
                        <Music className="h-8 w-8 text-primary-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="h-10 w-10 rounded-full gradient-rock flex items-center justify-center glow-red">
                        <Play className="h-4 w-4 text-primary-foreground ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-foreground truncate">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{profile?.username || "Artista"}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Upcoming Events */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl md:text-3xl text-foreground">EVENTOS</h2>
          </div>
          <Link to="/eventos" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Ver todos →
          </Link>
        </div>
        {events.length === 0 && !loading ? (
          <p className="text-muted-foreground text-center py-8">Nenhum evento próximo.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => {
              const profile = event.profiles as any;
              return (
                <div key={event.id} className="group relative overflow-hidden rounded-xl bg-card border border-border hover:border-primary/30 transition-colors cursor-pointer">
                  <div className="relative h-48 overflow-hidden bg-card">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={event.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="h-full w-full gradient-rock flex items-center justify-center">
                        <Calendar className="h-12 w-12 text-primary-foreground" />
                      </div>
                    )}
                    <span className="absolute top-3 left-3 px-3 py-1 rounded text-xs font-semibold bg-primary text-primary-foreground">
                      {profile?.username || "Evento"}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">
                      {new Date(event.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                    <h3 className="font-display text-xl text-foreground">{event.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{event.location}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Artists Row */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl md:text-3xl text-foreground">ARTISTAS</h2>
          </div>
          <Link to="/artistas" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Ver todos →
          </Link>
        </div>
        {artists.length === 0 && !loading ? (
          <p className="text-muted-foreground text-center py-8">Nenhum artista cadastrado ainda.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {artists.slice(0, 6).map((artist) => (
              <Link key={artist.id} to={`/artista/${artist.id}`} className="group text-center">
                <div className="aspect-square overflow-hidden rounded-lg mb-2 bg-card">
                  {artist.avatar_url ? (
                    <img src={artist.avatar_url} alt={artist.username} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="h-full w-full gradient-rock flex items-center justify-center">
                      <span className="font-display text-4xl text-primary-foreground">{artist.username[0]?.toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{artist.username}</h3>
                {artist.genre && <p className="text-xs text-muted-foreground">{artist.genre}</p>}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Top Singles / New Singles from DB */}
      {(spotifyContent.length > 0 || youtubeContent.length > 0) && (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {spotifyContent.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Music className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-2xl text-foreground">MÚSICAS RECENTES</h2>
                </div>
                <div className="space-y-1">
                  {spotifyContent.slice(0, 5).map((track, i) => {
                    const profile = track.profiles as any;
                    return (
                      <div key={track.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-card transition-colors cursor-pointer group">
                        <span className="w-5 text-center text-sm font-medium text-muted-foreground">{i + 1}</span>
                        <div className="h-10 w-10 rounded bg-card overflow-hidden flex-shrink-0">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full gradient-rock flex items-center justify-center">
                              <Music className="h-4 w-4 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{track.title}</p>
                          <p className="text-xs text-muted-foreground">{profile?.username || "Artista"}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {youtubeContent.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Music className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-2xl text-foreground">VÍDEOS RECENTES</h2>
                </div>
                <div className="space-y-1">
                  {youtubeContent.slice(0, 5).map((track, i) => {
                    const profile = track.profiles as any;
                    return (
                      <div key={track.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-card transition-colors cursor-pointer group">
                        <span className="w-5 text-center text-sm font-medium text-muted-foreground">{i + 1}</span>
                        <div className="h-10 w-10 rounded bg-card overflow-hidden flex-shrink-0">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full gradient-rock flex items-center justify-center">
                              <Play className="h-4 w-4 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{track.title}</p>
                          <p className="text-xs text-muted-foreground">{profile?.username || "Artista"}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;
