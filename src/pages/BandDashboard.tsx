import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toEmbed, embedTypeToContentType } from "@/lib/embedUtils";
import { SmartPlayer } from "@/components/SmartPlayer";
import { ChatList } from "@/components/ChatList";
import { Save, Plus, Trash2, Music, Video, User, Calendar, ArrowLeft, Headphones, ShoppingBag, Upload, CreditCard, X, AlertTriangle } from "lucide-react";

interface ContentItem {
  id: string;
  type: "spotify_link" | "youtube_link" | "bandcamp_link" | "soundcloud_link";
  url: string;
  title: string;
}

const BandDashboard = () => {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // If admin is managing a specific band
  const adminBandId = searchParams.get("bandId");
  const isAdminMode = !!adminBandId && isAdmin;
  const targetId = isAdminMode ? adminBandId : user?.id;

  const [bandName, setBandName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [genre, setGenre] = useState("");
  const [subgenre, setSubgenre] = useState("");
  const [estado, setEstado] = useState("");
  const [pixLink, setPixLink] = useState("");
  const [pixQrcodeUrl, setPixQrcodeUrl] = useState("");
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newExclusive, setNewExclusive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Event form state
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventCity, setEventCity] = useState("");
  const [eventUF, setEventUF] = useState("");
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [eventImageUrl, setEventImageUrl] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [savingEvent, setSavingEvent] = useState(false);

  // Products state
  const [products, setProducts] = useState<any[]>([]);
  const [productSlots, setProductSlots] = useState(0);
  const [newProductTitle, setNewProductTitle] = useState("");
  const [newProductDesc, setNewProductDesc] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductImage, setNewProductImage] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);

  // Payment request state
  const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
  const [proofUrl, setProofUrl] = useState("");
  const [slotsRequested, setSlotsRequested] = useState("1");
  const [sendingRequest, setSendingRequest] = useState(false);

  // Paywall modal state
  const [showPaywall, setShowPaywall] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  // Site PIX key (from site_settings)
  const [sitePixKey, setSitePixKey] = useState("");

  const productCategories = ["Camisetas", "Vinil / CD", "Acessórios", "Instrumentos", "Outros"];

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!isAdminMode && user?.user_metadata?.user_type !== "banda") {
      navigate("/");
      return;
    }
    if (targetId) {
      loadProfile();
      loadContent();
      loadEvents();
      loadProducts();
      loadPaymentRequests();
      loadSitePixKey();
    }
  }, [user, targetId, isAdmin]);

  const loadProfile = async () => {
    if (!targetId) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetId)
      .single();
    if (data) {
      setBandName(data.username || "");
      setBio(data.bio || "");
      setAvatarUrl(data.avatar_url || "");
      setBannerUrl(data.banner_url || "");
      setGenre(data.genre || "");
      setSubgenre(data.subgenre || "");
      setEstado(data.estado || "");
      setPixLink(data.pix_link || "");
      setPixQrcodeUrl(data.pix_qrcode_url || "");
      setProductSlots((data as any).product_slots || 0);
    }
    setLoading(false);
  };

  const loadContent = async () => {
    if (!targetId) return;
    const { data } = await supabase
      .from("content")
      .select("*")
      .eq("artist_id", targetId)
      .order("created_at", { ascending: false });
    if (data) setContents(data);
  };

  const saveProfile = async () => {
    if (!targetId) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ bio, avatar_url: avatarUrl, banner_url: bannerUrl, genre, subgenre, estado, pix_link: pixLink, pix_qrcode_url: pixQrcodeUrl })
      .eq("id", targetId);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!" });
    }
  };

  const addContent = async () => {
    if (!targetId || !newUrl || !newTitle) return;
    const embed = toEmbed(newUrl);
    if (!embed) {
      toast({ title: "Link inválido", description: "Cole um link do Spotify, YouTube, SoundCloud ou Bandcamp.", variant: "destructive" });
      return;
    }
    const type = embedTypeToContentType(embed.type);
    const { error } = await supabase
      .from("content")
      .insert({ artist_id: targetId, type, url: newUrl, title: newTitle, is_exclusive: newExclusive } as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setNewUrl("");
      setNewTitle("");
      setNewExclusive(false);
      loadContent();
      toast({ title: "Conteúdo adicionado!" });
    }
  };

  const deleteContent = async (id: string) => {
    await supabase.from("content").delete().eq("id", id);
    loadContent();
  };

  const loadEvents = async () => {
    if (!targetId) return;
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("artist_id", targetId)
      .order("date", { ascending: false });
    if (data) setEvents(data);
  };

  const addEvent = async () => {
    if (!targetId || !eventTitle || !eventDate || !eventVenue || !eventUF) return;
    setSavingEvent(true);
    const dateTime = eventTime ? `${eventDate}T${eventTime}:00` : `${eventDate}T00:00:00`;
      let imageUrl = "";

      if (eventImageFile) {
        const ext = eventImageFile.name.split(".").pop();
        const path = `events/${targetId}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("site-assets")
          .upload(path, eventImageFile, { upsert: true });
        if (uploadErr) {
          toast({ title: "Erro ao enviar imagem", description: uploadErr.message, variant: "destructive" });
          setSavingEvent(false);
          return;
        }
        imageUrl = supabase.storage.from("site-assets").getPublicUrl(path).data.publicUrl;
      }
    const location = `${eventVenue}, ${eventCity ? eventCity + ", " : ""}${eventUF}`;
    const { error } = await supabase
      .from("events")
      .insert({ artist_id: targetId, title: eventTitle, date: dateTime, location, city: eventCity, image_url: imageUrl });
    setSavingEvent(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setEventTitle(""); setEventDate(""); setEventTime(""); setEventVenue(""); setEventCity(""); setEventUF("");
      loadEvents();
      toast({ title: "Evento cadastrado!" });
    }
  };

  const deleteEvent = async (id: string) => {
    await supabase.from("events").delete().eq("id", id);
    loadEvents();
  };

  // --- Products ---
  const loadProducts = async () => {
    if (!targetId) return;
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("owner_id", targetId)
      .order("created_at", { ascending: false });
    if (data) setProducts(data);
  };

  const addProduct = async () => {
    if (!targetId || !newProductTitle || !newProductPrice) return;
    const remainingSlots = productSlots - products.length;
    if (remainingSlots <= 0) {
      setShowPaywall(true);
      return;
    }
    setSavingProduct(true);
    const { error } = await supabase.from("products").insert({
      owner_id: targetId,
      title: newProductTitle.slice(0, 100),
      description: newProductDesc.slice(0, 1000),
      price: parseFloat(newProductPrice) || 0,
      image_url: newProductImage || null,
      category: newProductCategory,
    } as any);
    setSavingProduct(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setNewProductTitle(""); setNewProductDesc(""); setNewProductPrice(""); setNewProductImage(""); setNewProductCategory("");
      loadProducts();
      toast({ title: "Produto cadastrado!" });
    }
  };

  const deleteProduct = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    loadProducts();
  };

  // --- Payment Requests ---
  const loadPaymentRequests = async () => {
    if (!targetId) return;
    const { data } = await supabase
      .from("payment_requests")
      .select("*")
      .eq("band_id", targetId)
      .order("created_at", { ascending: false });
    if (data) setPaymentRequests(data);
  };

  const sendPaymentRequest = async () => {
    if (!targetId || !proofUrl) return;
    setSendingRequest(true);
    const { error } = await supabase.from("payment_requests").insert({
      band_id: targetId,
      proof_url: proofUrl,
      slots_requested: 20,
    } as any);
    setSendingRequest(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setProofUrl("");
      setShowPaywall(false);
      loadPaymentRequests();
      toast({ title: "Solicitação enviada! Aguarde a aprovação do admin." });
    }
  };

  const loadSitePixKey = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "pix_key")
      .maybeSingle();
    if (data) setSitePixKey(data.value);
  };

  const uploadProofFile = async () => {
    if (!proofFile || !targetId) return;
    setUploadingProof(true);
    const ext = proofFile.name.split(".").pop();
    const path = `${targetId}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from("payment-proofs")
      .upload(path, proofFile);
    if (uploadErr) {
      toast({ title: "Erro no upload", description: uploadErr.message, variant: "destructive" });
      setUploadingProof(false);
      return;
    }
    setUploadingProof(false);
    // Auto-send payment request after upload
    setSendingRequest(true);
    const { error } = await supabase.from("payment_requests").insert({
      band_id: targetId,
      proof_url: path,
      slots_requested: 20,
    } as any);
    setSendingRequest(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setProofFile(null);
      setProofUrl("");
      setShowPaywall(false);
      loadPaymentRequests();
      toast({ title: "Comprovante enviado! Aguarde a aprovação." });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8">
      {isAdminMode && (
        <button onClick={() => navigate("/admin")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao painel admin
        </button>
      )}
      <h1 className="font-display text-3xl md:text-4xl text-foreground">
        {isAdminMode ? `GERENCIAR: ${bandName}` : "PAINEL DA BANDA"}
      </h1>

      {/* Profile Section */}
      <section className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="font-display text-2xl text-foreground">PERFIL</h2>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 1000))}
            rows={4}
            maxLength={1000}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
            placeholder="Conte sobre sua banda..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">URL do Avatar</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">URL do Banner</label>
            <input
              type="url"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">Gênero</label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              placeholder="Death Metal"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">Subgênero</label>
            <input
              type="text"
              value={subgenre}
              onChange={(e) => setSubgenre(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              placeholder="Brutal Death Metal"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">Estado (UF)</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="">Selecione</option>
              {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">Foto do Evento (opcional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setEventImageFile(e.target.files?.[0] || null)}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            {eventImageFile && (
              <p className="text-xs text-muted-foreground mt-1">{eventImageFile.name}</p>
            )}
          </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">Chave Pix</label>
            <input
              type="text"
              value={pixLink}
              onChange={(e) => setPixLink(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              placeholder="email@pix.com ou chave"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground">URL QR Code Pix</label>
          <input
            type="url"
            value={pixQrcodeUrl}
            onChange={(e) => setPixQrcodeUrl(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            placeholder="https://..."
          />
        </div>

        <button
          onClick={saveProfile}
          disabled={saving}
          className="flex items-center gap-2 h-10 px-6 rounded-lg gradient-rock text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : "Salvar Perfil"}
        </button>
      </section>

      {/* Content Section */}
      <section className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <Music className="h-5 w-5 text-primary" />
          <h2 className="font-display text-2xl text-foreground">CONTEÚDO</h2>
        </div>

        {/* Add new content */}
        <div className="space-y-3 p-4 rounded-lg border border-border bg-background">
          <p className="text-xs font-medium text-muted-foreground">Adicionar link do Spotify, YouTube, SoundCloud ou Bandcamp</p>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value.slice(0, 100))}
            maxLength={100}
            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            placeholder="Título do conteúdo"
          />
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            placeholder="https://open.spotify.com/track/... | youtube.com/watch?v=... | soundcloud.com/... | xxx.bandcamp.com/track/..."
          />
          {newUrl && toEmbed(newUrl) && (
            <div className="rounded-lg overflow-hidden border border-border">
              <SmartPlayer
                type={toEmbed(newUrl)!.type}
                embedUrl={toEmbed(newUrl)!.embedUrl}
                title={newTitle || "Preview"}
              />
            </div>
           )}
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={newExclusive}
              onChange={(e) => setNewExclusive(e.target.checked)}
              className="rounded border-border"
            />
            Exclusivo para seguidores (somente vídeos)
          </label>
          <button
            onClick={addContent}
            className="flex items-center gap-2 h-9 px-5 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>

        {/* Content list */}
        <div className="space-y-2">
          {contents.map((item) => {
            const embed = toEmbed(item.url);
            return (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
                {item.type === "spotify_link" ? (
                  <Music className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : item.type === "soundcloud_link" ? (
                  <Headphones className="h-4 w-4 text-orange-500 flex-shrink-0" />
                ) : item.type === "bandcamp_link" ? (
                  <Music className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                ) : (
                  <Video className="h-4 w-4 text-red-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                </div>
                <button
                  onClick={() => deleteContent(item.id)}
                  className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
          {contents.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum conteúdo adicionado ainda.</p>
          )}
        </div>
      </section>

      {/* Events Section */}
      <section className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="font-display text-2xl text-foreground">CADASTRAR SHOW / EVENTO</h2>
        </div>

        <div className="space-y-3 p-4 rounded-lg border border-border bg-background">
          <input
            type="text"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value.slice(0, 100))}
            maxLength={100}
            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            placeholder="Nome do Evento"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            />
            <input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <input
            type="text"
            value={eventVenue}
            onChange={(e) => setEventVenue(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            placeholder="Local (Nome do Venue)"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={eventCity}
              onChange={(e) => setEventCity(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              placeholder="Cidade"
            />
            <select
              value={eventUF}
              onChange={(e) => setEventUF(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="">Estado (UF)</option>
              {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">Foto do Evento (opcional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setEventImageFile(e.target.files?.[0] || null)}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            {eventImageFile && (
              <p className="text-xs text-muted-foreground mt-1">{eventImageFile.name}</p>
            )}
          </div>
          </div>
          <button
            onClick={addEvent}
            disabled={savingEvent}
            className="flex items-center gap-2 h-9 px-5 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {savingEvent ? "Salvando..." : "Cadastrar Evento"}
          </button>
        </div>

        {/* Events list */}
        <div className="space-y-2">
          {events.map((ev) => (
            <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
              <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {new Date(ev.date).toLocaleDateString("pt-BR")} · {ev.location}
                </p>
              </div>
              <button
                onClick={() => deleteEvent(ev.id)}
                className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {events.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento cadastrado ainda.</p>
          )}
        </div>
      </section>

      {/* Chat Section */}
      <section className="rounded-xl border border-border bg-card p-6">
        <ChatList />
      </section>

      {/* Products Section */}
      <section className="space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl text-foreground">PRODUTOS</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-primary">
              {Math.max(0, productSlots - products.length)}
            </span>
            <span className="text-xs text-muted-foreground">slots restantes</span>
          </div>
        </div>

        {/* Slot counter banner */}
        <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/20 bg-primary/5">
          <ShoppingBag className="h-5 w-5 text-primary flex-shrink-0" />
          <p className="text-sm text-foreground">
            Você possui <span className="font-bold text-primary">{Math.max(0, productSlots - products.length)}</span> slots de produtos restantes.
            {productSlots === 0 && " Faça uma contribuição para começar a anunciar."}
          </p>
        </div>

        {/* Add product form - always show */}
        <div className="space-y-3 p-4 rounded-lg border border-border bg-background">
          <p className="text-xs font-medium text-muted-foreground">Adicionar produto</p>
          <input
            type="text"
            value={newProductTitle}
            onChange={(e) => setNewProductTitle(e.target.value.slice(0, 100))}
            maxLength={100}
            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            placeholder="Título do produto"
          />
          <textarea
            value={newProductDesc}
            onChange={(e) => setNewProductDesc(e.target.value.slice(0, 1000))}
            maxLength={1000}
            rows={3}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
            placeholder="Descrição"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="number"
              min="0"
              step="0.01"
              value={newProductPrice}
              onChange={(e) => setNewProductPrice(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              placeholder="Preço (R$)"
            />
            <select
              value={newProductCategory}
              onChange={(e) => setNewProductCategory(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="">Categoria</option>
              {productCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">Foto do Evento (opcional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setEventImageFile(e.target.files?.[0] || null)}
              className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            {eventImageFile && (
              <p className="text-xs text-muted-foreground mt-1">{eventImageFile.name}</p>
            )}
          </div>
          </div>
          <input
            type="url"
            value={newProductImage}
            onChange={(e) => setNewProductImage(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            placeholder="URL da imagem do produto"
          />
          <button
            onClick={addProduct}
            disabled={savingProduct || !newProductTitle || !newProductPrice}
            className="flex items-center gap-2 h-9 px-5 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {savingProduct ? "Salvando..." : "Adicionar Produto"}
          </button>
        </div>

        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
              {p.image_url ? (
                <img src={p.image_url} alt="" className="h-10 w-10 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                <p className="text-xs text-muted-foreground">R$ {Number(p.price).toFixed(2).replace(".", ",")} · {p.category || "Sem categoria"}</p>
              </div>
              <button onClick={() => deleteProduct(p.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {products.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum produto cadastrado.</p>
          )}
        </div>
      </section>

      {/* Payment History */}
      {paymentRequests.length > 0 && (
        <section className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl text-foreground">HISTÓRICO DE CONTRIBUIÇÕES</h2>
          </div>
          <div className="space-y-2">
            {paymentRequests.map((req) => (
              <div key={req.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
                <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">+{req.slots_requested} slots</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(req.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  req.status === "approved" ? "bg-primary/20 text-primary" :
                  req.status === "rejected" ? "bg-destructive/20 text-destructive" :
                  "bg-accent/20 text-accent"
                }`}>
                  {req.status === "approved" ? "Aprovado" : req.status === "rejected" ? "Rejeitado" : "Pendente"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-primary/30 bg-card p-6 space-y-5 shadow-lg relative">
            <button
              onClick={() => setShowPaywall(false)}
              className="absolute top-4 right-4 p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full gradient-rock flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl text-foreground">CONTRIBUIÇÃO DE MANUTENÇÃO</h2>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Para mantermos o banco de dados, a hospedagem e nossa equipe técnica funcionando, solicitamos uma contribuição de <span className="font-bold text-primary">R$ 10,00</span> a cada <span className="font-bold text-foreground">20 produtos</span> anunciados. Sem o apoio da comunidade, o Nacional Rock Br não consegue se manter no ar.
            </p>

            {/* PIX Key */}
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
              <p className="text-xs font-semibold text-foreground">Chave Pix do Nacional Rock Br:</p>
              {sitePixKey ? (
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono text-primary bg-background rounded px-3 py-2 border border-border truncate">
                    {sitePixKey}
                  </code>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(sitePixKey);
                      toast({ title: "Chave Pix copiada!" });
                    }}
                    className="h-9 px-3 rounded-lg border border-primary text-primary text-xs font-medium hover:bg-primary/10 transition-colors"
                  >
                    Copiar
                  </button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Chave Pix não configurada. Entre em contato com o admin.</p>
              )}
            </div>

            {/* Upload proof */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground">Envie o comprovante:</p>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground hover:file:opacity-90 w-full"
              />
              <button
                onClick={uploadProofFile}
                disabled={!proofFile || uploadingProof || sendingRequest}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-lg gradient-rock text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {uploadingProof ? "Enviando..." : sendingRequest ? "Processando..." : "Enviar Comprovante"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BandDashboard;
