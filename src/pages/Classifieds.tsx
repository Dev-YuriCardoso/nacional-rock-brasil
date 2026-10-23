import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Megaphone, Plus, Trash2, MapPin, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Classified {
  id: string;
  user_id: string;
  category: string;
  estado: string;
  description: string;
  title: string;
  contact: string;
  created_at: string;
}

const CATEGORIES = [
  "Vocalista", "Guitarrista", "Baixista", "Baterista",
  "Tecladista", "Produtor", "Estúdio", "Outros",
];

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const Classifieds = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ads, setAds] = useState<Classified[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterCat, setFilterCat] = useState("");
  const [filterUF, setFilterUF] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [estado, setEstado] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    const { data } = await supabase
      .from("classifieds")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setAds(data || []);
    setLoading(false);
  };

  const createAd = async () => {
    if (!user || !title.trim() || !category || !estado || !description.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("classifieds").insert({
      user_id: user.id,
      title: title.trim(),
      category,
      estado,
      description: description.trim(),
      contact: contact.trim(),
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setTitle(""); setCategory(""); setEstado(""); setDescription(""); setContact("");
      setShowForm(false);
      loadAds();
      toast({ title: "Classificado publicado!" });
    }
  };

  const deleteAd = async (id: string) => {
    await supabase.from("classifieds").delete().eq("id", id);
    loadAds();
  };

  const filtered = ads.filter((a) => {
    if (filterCat && a.category !== filterCat) return false;
    if (filterUF && a.estado !== filterUF) return false;
    return true;
  });

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs}h atrás`;
    return `${Math.floor(hrs / 24)}d atrás`;
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span>→</span>
        <span className="text-foreground">Classificados</span>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h1 className="font-display text-3xl md:text-4xl text-foreground">CLASSIFICADOS</h1>
        </div>
        {user && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 h-9 px-4 rounded-lg gradient-rock text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Novo Anúncio
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && user && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3 max-w-lg">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 100))}
            placeholder="Título do anúncio"
            maxLength={100}
            className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          <div className="grid grid-cols-2 gap-3">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer">
              <option value="">Categoria</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={estado} onChange={(e) => setEstado(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer">
              <option value="">Estado (UF)</option>
              {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
            placeholder="Descrição detalhada..."
            rows={4}
            maxLength={1000}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
          />
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value.slice(0, 200))}
            placeholder="Contato (Instagram, email, etc.)"
            maxLength={200}
            className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={createAd}
            disabled={saving || !title.trim() || !category || !estado || !description.trim()}
            className="flex items-center gap-2 h-9 px-5 rounded-lg gradient-rock text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? "Publicando..." : "Publicar Anúncio"}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer">
          <option value="">Todas categorias</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterUF} onChange={(e) => setFilterUF(e.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer">
          <option value="">Todos estados</option>
          {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
        </select>
      </div>

      {/* Ads list */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum classificado encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ad) => (
            <div key={ad.id} className="rounded-xl border border-border bg-card p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  {ad.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {ad.estado}
                </span>
              </div>
              <h3 className="font-display text-lg text-foreground">{ad.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">{ad.description}</p>
              {ad.contact && user ? (
                <p className="text-xs text-primary">Contato: {ad.contact}</p>
              ) : ad.contact && !user ? (
                <p className="text-xs text-muted-foreground italic">
                  <a href="/auth" className="text-primary hover:underline">Faça login</a> para ver o contato
                </p>
              ) : null}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground">{timeAgo(ad.created_at)}</span>
                {user?.id === ad.user_id && (
                  <button onClick={() => deleteAd(ad.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Classifieds;
