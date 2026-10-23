import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { events } from "@/data/mockData";

const genreFilters = [
  "Todos", "Metal", "Death Metal", "Thrash Metal", "Black Metal",
  "Power Metal", "Symphonic Metal", "Nu-Metal", "Emo", "Punk",
  "Goth", "Hard Rock", "Alternative",
];

const estados = [
  "Todos", "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ",
  "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

const Artists = () => {
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [estadoFilter, setEstadoFilter] = useState("Todos");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArtists();
  }, [activeFilter, estadoFilter, search]);

  const loadArtists = async () => {
    setLoading(true);
    let query = supabase
      .from("profiles")
      .select("id, username, avatar_url, genre, subgenre, estado")
      .eq("user_type", "banda");

    if (activeFilter !== "Todos") {
      if (activeFilter === "Metal") {
        query = query.ilike("genre", "%metal%");
      } else {
        query = query.eq("genre", activeFilter);
      }
    }

    if (estadoFilter !== "Todos") {
      query = query.eq("estado", estadoFilter);
    }

    if (search) {
      query = query.ilike("username", `%${search}%`);
    }

    const { data } = await query.order("created_at", { ascending: false });
    setArtists(data || []);
    setLoading(false);
  };

  const displayed = showAll ? artists : artists.slice(0, 18);

  return (
    <div className="p-4 md:p-8 space-y-5 md:space-y-8">
      {/* Breadcrumb - hidden on mobile */}
      <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span>→</span>
        <span className="text-foreground">Artistas</span>
      </div>

      <h1 className="font-display text-2xl md:text-4xl text-foreground">ARTISTAS</h1>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full sm:w-48 rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="h-9 flex-1 sm:flex-none rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
          >
            {genreFilters.map((genre) => (
              <option key={genre} value={genre}>{genre === "Todos" ? "Todos os gêneros" : genre}</option>
            ))}
          </select>
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="h-9 flex-1 sm:flex-none rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
          >
            {estados.map((uf) => (
              <option key={uf} value={uf}>{uf === "Todos" ? "Todos os estados" : uf}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Genre Pills - compact on mobile */}
      <div className="flex flex-wrap gap-1.5 md:gap-2">
        {genreFilters.map((genre) => (
          <button
            key={genre}
            onClick={() => setActiveFilter(genre)}
            className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[11px] md:text-xs font-medium transition-all ${
              activeFilter === genre
                ? "gradient-rock text-primary-foreground"
                : "border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            }`}
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Artist Grid */}
      {loading ? (
        <p className="text-muted-foreground text-center py-12">Carregando artistas...</p>
      ) : displayed.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Nenhum artista encontrado.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {displayed.map((artist) => (
            <Link key={artist.id} to={`/artista/${artist.id}`} className="group">
              <div className="relative aspect-square overflow-hidden rounded-lg mb-1.5 md:mb-2 bg-card">
                {artist.avatar_url ? (
                  <img src={artist.avatar_url} alt={artist.username} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <div className="h-full w-full gradient-rock flex items-center justify-center">
                    <span className="font-display text-3xl md:text-4xl text-primary-foreground">{artist.username[0]?.toUpperCase()}</span>
                  </div>
                )}
              </div>
              <h3 className="text-xs md:text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                {artist.username}
              </h3>
              {artist.genre && (
                <p className="text-[10px] md:text-xs text-muted-foreground">{artist.genre}</p>
              )}
            </Link>
          ))}
        </div>
      )}

      {!showAll && artists.length > 18 && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowAll(true)}
            className="px-8 py-2.5 rounded-lg gradient-rock text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            CARREGAR MAIS
          </button>
        </div>
      )}

      {/* Upcoming Events */}
      <section className="pt-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl md:text-3xl text-foreground">EVENTOS</h2>
          </div>
          <Link to="/eventos" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Ver todos →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.slice(0, 3).map((event) => (
            <div key={event.id} className="group relative overflow-hidden rounded-xl bg-card border border-border hover:border-primary/30 transition-colors cursor-pointer">
              <div className="relative h-40 md:h-48 overflow-hidden">
                <img src={event.image} alt={event.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <span className="absolute top-3 left-3 px-3 py-1 rounded text-xs font-semibold bg-primary text-primary-foreground">
                  Comprar ingresso
                </span>
              </div>
              <div className="p-3 md:p-4">
                <p className="text-xs text-muted-foreground mb-1">{event.date}</p>
                <h3 className="font-display text-lg md:text-xl text-foreground">{event.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{event.location}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Artists;
