import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingBag, Search, Filter, MapPin, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { ChatRoom } from "@/components/ChatRoom";
import { useChatRoom } from "@/hooks/useChatRoom";

interface Product {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  price: number;
  image_url: string | null;
  category: string;
  status: string;
  created_at: string;
  owner?: { username: string; avatar_url: string | null; estado: string | null };
}

const categories = [
  "Camisetas", "Vinil / CD", "Acessórios", "Instrumentos", "Outros",
];

const estados = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

const Marketplace = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [estado, setEstado] = useState("");
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [activeChatName, setActiveChatName] = useState("");
  const { openOrCreateRoom } = useChatRoom();

  const handleBuy = async (product: Product) => {
    const result = await openOrCreateRoom(product.owner_id, product.id);
    if (result) {
      setActiveChatRoomId(result.roomId);
      setActiveChatName(result.bandUsername);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [category, estado]);

  const loadProducts = async () => {
    setLoading(true);
    let query = supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (category) query = query.eq("category", category);

    const { data } = await query;

    if (data && data.length > 0) {
      const ownerIds = [...new Set(data.map((p: any) => p.owner_id))];
      const { data: owners } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, estado")
        .in("id", ownerIds);
      const ownerMap = new Map((owners || []).map((o) => [o.id, o]));
      let enriched = data.map((p: any) => ({ ...p, owner: ownerMap.get(p.owner_id) }));
      
      // Filter by estado (owner's estado)
      if (estado) {
        enriched = enriched.filter((p) => p.owner?.estado === estado);
      }
      
      setProducts(enriched);
    } else {
      setProducts([]);
    }
    setLoading(false);
  };

  const filtered = search
    ? products.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.owner?.username.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingBag className="h-7 w-7 text-primary" />
        <h1 className="font-display text-3xl md:text-4xl text-foreground">
          MARKETPLACE
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto ou banda..."
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 rounded-lg border border-border bg-card pl-9 pr-8 text-sm text-foreground cursor-pointer focus:outline-none focus:border-primary transition-colors appearance-none"
          >
            <option value="">Todas categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="h-10 rounded-lg border border-border bg-card pl-9 pr-8 text-sm text-foreground cursor-pointer focus:outline-none focus:border-primary transition-colors appearance-none"
          >
            <option value="">Todos estados</option>
            {estados.map((uf) => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Nenhum produto encontrado.</p>
          {user?.user_metadata?.user_type === "banda" && (
            <Link to="/dashboard" className="inline-block text-sm text-primary hover:underline">
              Cadastre seus produtos no Dashboard →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 transition-colors"
            >
              <div className="aspect-square bg-muted relative overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}
                {product.category && (
                  <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-background/80 text-foreground backdrop-blur-sm">
                    {product.category}
                  </span>
                )}
              </div>
              <div className="p-3 space-y-1.5">
                <p className="text-sm font-medium text-foreground truncate">{product.title}</p>
                {product.owner && (
                  <Link
                    to={`/artista/${product.owner_id}`}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors truncate block"
                  >
                    {product.owner.username}
                    {product.owner.estado && (
                      <span className="ml-1 text-primary">· {product.owner.estado}</span>
                    )}
                  </Link>
                )}
                <p className="text-base font-bold text-primary">
                  R$ {product.price.toFixed(2).replace(".", ",")}
                </p>
                {user && user.id !== product.owner_id && (
                  <button
                    onClick={() => handleBuy(product)}
                    className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg gradient-rock text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity mt-1"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Comprar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeChatRoomId && (
        <ChatRoom
          roomId={activeChatRoomId}
          otherUsername={activeChatName}
          onClose={() => setActiveChatRoomId(null)}
        />
      )}
    </div>
  );
};

export default Marketplace;
