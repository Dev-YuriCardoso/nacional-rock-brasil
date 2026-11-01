import { useState, useEffect } from "react";
import { Play, Calendar, TrendingUp, Users, Music, ArrowRight, MapPin, Search, ShoppingBag, Headphones } from "lucide-react";
import { Link } from "react-router-dom";
import { HeroCarousel } from "@/components/HeroCarousel";
import { TrendingRegional } from "@/components/TrendingRegional";
import { AccountAccessCard } from "@/components/AccountAccessCard";
import { supabase } from "@/integrations/supabase/client";
import { useGeo } from "@/contexts/GeoContext";

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
  profiles: { username: string; avatar_url: string | null; user_type: string } | null;
}

interface EventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  city: string;
  artist_id: string;
  image_url: string | null;
  profiles: { username: string; avatar_url: string | null } | null;
}

const quickLinks = [
  { title: "Descobrir bandas", subtitle: "Encontre seu próximo som", url: "/artistas", icon: Users },
  { title: "Agenda de shows", subtitle: "O que acontece por perto", url: "/eventos", icon: Calendar },
  { title: "Loja independente", subtitle: "Apoie quem faz música", url: "/loja", icon: ShoppingBag },
];

const HomeSectionHeading = ({
  eyebrow,
  title,
  icon: Icon,
  link,
  linkLabel = "Ver todos",
}: {
  eyebrow?: string;
  title: string;
  icon: typeof Music;
  link: string;
  linkLabel?: string;
}) => (
  <div className="mb-3 flex items-end justify-between gap-3 sm:mb-5">
    <div className="min-w-0">
      {eyebrow && <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>}
      <h2 className="flex items-center gap-2 font-display text-xl leading-tight text-foreground sm:text-2xl md:text-3xl">
        <Icon className="h-5 w-5 shrink-0 text-primary" />
        <span className="truncate">{title}</span>
      </h2>
    </div>
    <Link to={link} className="flex shrink-0 items-center gap-1 pb-0.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary sm:text-sm">
      {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  </div>
);

const Index = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [newContent, setNewContent] = useState<ContentItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { detectedState } = useGeo();

  useEffect(() => {
    let cancelled = false;
    const loadHomeData = async () => {
      setLoading(true);
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
          .select("id, title, url, type, created_at, profiles!inner(username, avatar_url, user_type)")
          .eq("profiles.user_type", "banda")
          .order("created_at", { ascending: false })
          .limit(12),
        supabase
          .from("events")
          .select("id, title, date, location, city, artist_id, image_url, profiles(username, avatar_url)")
          .gte("date", new Date().toISOString())
          .order("date", { ascending: true })
          .limit(6),
      ]);

      if (cancelled) return;
      setArtists(artistsRes.data || []);
      setNewContent((contentRes.data as any) || []);
      setEvents((eventsRes.data as any) || []);
      setLoading(false);
    };

    loadHomeData();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-4 sm:space-y-10 sm:px-6 sm:py-6 md:space-y-12 md:px-8 md:py-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary sm:text-xs">Música independente brasileira</p>
          <h1 className="mt-1 font-display text-2xl leading-none text-foreground sm:text-3xl md:text-4xl">A CENA É SUA. DESCUBRA.</h1>
          <p className="mt-1.5 max-w-xl text-xs text-muted-foreground sm:text-sm">
            Bandas, shows e lançamentos que merecem ser ouvidos.
          </p>
        </div>
        <Link to="/buscar" aria-label="Buscar bandas, músicas e eventos" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary hover:text-primary sm:hidden">
          <Search className="h-4 w-4" />
        </Link>
      </div>

      <HeroCarousel />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        {quickLinks.map((item) => (
          <Link key={item.url} to={item.url} className="group flex min-h-[68px] items-center gap-3 rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/40 hover:bg-primary/[0.04] sm:min-h-[82px] sm:p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <item.icon className="h-5 w-5" />
            </div>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">{item.title}</span>
              <span className="block text-[11px] text-muted-foreground sm:text-xs">{item.subtitle}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </Link>
        ))}
      </div>

      <AccountAccessCard />

      <TrendingRegional />

      <section>
        <HomeSectionHeading
          eyebrow="Ouça e conheça"
          title="NOVOS LANÇAMENTOS"
          icon={TrendingUp}
          link="/artistas"
          linkLabel="Todas as bandas"
        />
        {loading ? (
          <p className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">Carregando lançamentos...</p>
        ) : newContent.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/60 px-4 py-8 text-center">
            <Music className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Os próximos sons podem aparecer aqui.</p>
            <p className="mt-1 text-xs text-muted-foreground">Quando as bandas publicarem músicas e vídeos, você encontra tudo nesta área.</p>
            <Link to="/artistas" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">Conhecer bandas <ArrowRight className="h-3 w-3" /></Link>
          </div>
        ) : (
          <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 md:grid-cols-4 lg:grid-cols-6">
            {newContent.map((item) => {
              const profile = item.profiles;
              return (
                <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="group w-[146px] shrink-0 snap-start sm:w-auto">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-card shadow-sm">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.username} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center gradient-rock">
                        <Music className="h-9 w-9 text-primary-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                        <Play className="ml-0.5 h-4 w-4" />
                      </span>
                    </div>
                    <span className="absolute bottom-2 left-2 rounded-md bg-black/65 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">
                      {item.type === "youtube_link" ? "Vídeo" : item.type === "spotify_link" ? "Spotify" : item.type === "soundcloud_link" ? "SoundCloud" : "Bandcamp"}
                    </span>
                  </div>
                  <h3 className="mt-2 truncate text-xs font-semibold text-foreground group-hover:text-primary sm:text-sm">{item.title}</h3>
                  <p className="truncate text-[10px] text-muted-foreground sm:text-xs">{profile?.username || "Artista"}</p>
                </a>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <HomeSectionHeading
          eyebrow={detectedState ? "Programação perto de você" : "Fique por dentro"}
          title={detectedState ? "PRÓXIMOS EVENTOS · " + detectedState : "PRÓXIMOS EVENTOS"}
          icon={Calendar}
          link="/eventos"
          linkLabel="Ver agenda"
        />
        {loading ? (
          <p className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">Carregando eventos...</p>
        ) : events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/60 px-4 py-8 text-center">
            <Calendar className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Nenhum evento cadastrado por enquanto.</p>
            <p className="mt-1 text-xs text-muted-foreground">Confira a agenda mais tarde ou explore as bandas.</p>
            <Link to="/eventos" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">Abrir agenda <ArrowRight className="h-3 w-3" /></Link>
          </div>
        ) : (
          <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {events.map((event) => {
              const profile = event.profiles;
              const eventDate = new Date(event.date);
              return (
                <Link key={event.id} to={"/artista/" + event.artist_id} className="group w-[270px] shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40 sm:w-auto">
                  <div className="relative h-36 overflow-hidden bg-background sm:h-44">
                    {event.image_url ? (
                      <img src={event.image_url} alt={"Capa do evento " + event.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-secondary">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-1 text-[10px] font-semibold text-white">{profile?.username || "Evento"}</span>
                  </div>
                  <div className="p-3 sm:p-4">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-primary">
                      {eventDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                    <h3 className="mt-1 font-display text-lg leading-tight text-foreground sm:text-xl">{event.title}</h3>
                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" /> {event.city ? event.city + " · " + event.location : event.location}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <HomeSectionHeading
          eyebrow="Conheça quem faz acontecer"
          title="BANDAS PARA DESCOBRIR"
          icon={Users}
          link="/artistas"
        />
        {loading ? (
          <p className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">Carregando artistas...</p>
        ) : artists.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/60 px-4 py-8 text-center">
            <Users className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Estamos abrindo espaço para novas bandas.</p>
            <p className="mt-1 text-xs text-muted-foreground">Conhece uma banda? Convide para fazer parte da cena.</p>
            <Link to="/auth?mode=signup&type=banda" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">Cadastrar uma banda <ArrowRight className="h-3 w-3" /></Link>
          </div>
        ) : (
          <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 md:grid-cols-6">
            {artists.slice(0, 12).map((artist) => (
              <Link key={artist.id} to={"/artista/" + artist.id} className="group w-[104px] shrink-0 snap-start text-center sm:w-auto">
                <div className="mx-auto aspect-square w-full overflow-hidden rounded-full border-2 border-border bg-card transition-colors group-hover:border-primary sm:rounded-2xl sm:border-0">
                  {artist.avatar_url ? (
                    <img src={artist.avatar_url} alt={artist.username} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center gradient-rock">
                      <span className="font-display text-3xl text-primary-foreground">{artist.username[0]?.toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <h3 className="mt-2 truncate text-[11px] font-semibold text-foreground group-hover:text-primary sm:text-sm">{artist.username}</h3>
                <p className="truncate text-[10px] text-muted-foreground">{artist.genre || "Rock nacional"}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-gradient-to-br from-card to-background p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Headphones className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl text-foreground sm:text-2xl">APOIE A CENA INDEPENDENTE</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">Siga, compartilhe, compareça aos shows e ajude bandas brasileiras a chegarem mais longe.</p>
            <Link to="/artistas" className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/40 px-4 text-xs font-bold text-primary transition-colors hover:bg-primary/10">
              Encontrar artistas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
