import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGeo } from "@/contexts/GeoContext";

const UFS = [
  "Todos", "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ",
  "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

interface EventRow {
  id: string;
  title: string;
  date: string;
  location: string;
  city: string;
  artist_id: string;
  profiles: { username: string; avatar_url: string | null } | null;
}

const Events = () => {
  const { detectedState } = useGeo();
  const [estadoFilter, setEstadoFilter] = useState("Todos");
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized && detectedState) {
      setEstadoFilter(detectedState);
      setInitialized(true);
    }
  }, [detectedState, initialized]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("id, title, date, location, city, artist_id, profiles(username, avatar_url)")
      .gte("date", new Date().toISOString())
      .order("date", { ascending: true });
    setEvents((data as any) || []);
    setLoading(false);
  };

  const filtered = events.filter((e) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !e.title.toLowerCase().includes(q) &&
        !e.location.toLowerCase().includes(q) &&
        !e.city.toLowerCase().includes(q) &&
        !(e.profiles as any)?.username?.toLowerCase().includes(q)
      ) return false;
    }
    if (estadoFilter !== "Todos") {
      if (!e.location.includes(estadoFilter) && !e.city.toLowerCase().includes(estadoFilter.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  const displayed = showAll ? filtered : filtered.slice(0, 18);

  return (
    <div className="p-4 md:p-8 space-y-5 md:space-y-8">
      {/* Breadcrumb - hidden on mobile */}
      <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span>→</span>
        <span className="text-foreground">Eventos</span>
      </div>

      <h1 className="font-display text-2xl md:text-4xl text-foreground">EVENTOS</h1>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar evento, local, banda..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full sm:w-52 rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
        >
          {UFS.map((uf) => (
            <option key={uf} value={uf}>{uf === "Todos" ? "Todos os estados" : uf}</option>
          ))}
        </select>
      </div>

      {/* State Pills - compact on mobile */}
      <div className="flex flex-wrap gap-1.5 md:gap-2">
        {UFS.map((uf) => (
          <button
            key={uf}
            onClick={() => setEstadoFilter(uf)}
            className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[11px] md:text-xs font-medium transition-all ${
              estadoFilter === uf
                ? "gradient-rock text-primary-foreground"
                : "border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            }`}
          >
            {uf}
          </button>
        ))}
      </div>

      {/* Geo hint */}
      {estadoFilter !== "Todos" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          <span>Exibindo eventos em <span className="text-foreground font-medium">{estadoFilter}</span></span>
        </div>
      )}

      {/* Event Grid */}
      {loading ? (
        <p className="text-muted-foreground text-center py-12">Carregando eventos...</p>
      ) : displayed.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Nenhum evento encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {displayed.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {!showAll && filtered.length > 18 && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowAll(true)}
            className="px-8 py-2.5 rounded-lg gradient-rock text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            CARREGAR MAIS
          </button>
        </div>
      )}
    </div>
  );
};

const EventCard = ({ event }: { event: EventRow }) => {
  const profile = event.profiles as any;
  const dateObj = new Date(event.date);

  return (
    <div className="group relative overflow-hidden rounded-xl bg-card border border-border hover:border-primary/30 transition-colors cursor-pointer">
      <div className="relative h-40 md:h-48 overflow-hidden bg-card">
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
      <div className="p-3 md:p-4">
        <p className="text-xs text-muted-foreground mb-1">
          {dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
          {" · "}
          {dateObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </p>
        <h3 className="font-display text-lg md:text-xl text-foreground">{event.title}</h3>
        <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{event.city ? `${event.location}, ${event.city}` : event.location}</span>
        </div>
      </div>
    </div>
  );
};

export default Events;
