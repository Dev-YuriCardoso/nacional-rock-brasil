import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Users, Guitar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserResult {
  id: string;
  username: string;
  avatar_url: string | null;
  user_type: "fã" | "banda";
  genre: string | null;
  estado: string | null;
}

const SearchUsers = () => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const searchUsers = async () => {
    setLoading(true);
    setHasSearched(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, user_type, genre, estado")
      .ilike("username", `%${search.trim()}%`)
      .eq("is_suspended", false)
      .order("created_at", { ascending: false })
      .limit(30);
    setResults(data || []);
    setLoading(false);
  };

  const getUserLink = (user: UserResult) => {
    return user.user_type === "banda" ? `/artista/${user.id}` : `/usuario/${user.id}`;
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span>→</span>
        <span className="text-foreground">Buscar Usuários</span>
      </div>

      <h1 className="font-display text-3xl md:text-4xl text-foreground">BUSCAR USUÁRIOS</h1>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nome de usuário..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          className="h-11 w-full rounded-lg border border-border bg-card pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Results */}
      {loading ? (
        <p className="text-muted-foreground text-sm text-center py-8">Buscando...</p>
      ) : hasSearched && results.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">Nenhum usuário encontrado.</p>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {results.map((user) => (
            <Link
              key={user.id}
              to={getUserLink(user)}
              className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-all"
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  className="h-14 w-14 rounded-full object-cover border-2 border-transparent group-hover:border-primary transition-colors"
                />
              ) : (
                <div className="h-14 w-14 rounded-full gradient-rock flex items-center justify-center flex-shrink-0">
                  <span className="font-display text-xl text-primary-foreground">
                    {user.username[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {user.username}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {user.user_type === "banda" ? (
                    <span className="flex items-center gap-1 text-xs text-primary">
                      <Guitar className="h-3 w-3" />
                      Banda
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      Fã
                    </span>
                  )}
                  {user.genre && (
                    <span className="text-xs text-muted-foreground">· {user.genre}</span>
                  )}
                  {user.estado && (
                    <span className="text-xs text-muted-foreground">· {user.estado}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Digite um nome para buscar usuários e bandas.</p>
        </div>
      )}
    </div>
  );
};

export default SearchUsers;
