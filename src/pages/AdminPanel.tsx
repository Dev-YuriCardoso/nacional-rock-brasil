import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Star, Plus, Trash2, Ban, Edit, Search, ArrowUp, ArrowDown, Image, LogOut, Settings, CreditCard, Check, X, MessageCircle, Eye } from "lucide-react";

const estados = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

const genres = [
  "Death Metal", "Thrash Metal", "Black Metal", "Power Metal",
  "Symphonic Metal", "Nu-Metal", "Emo", "Punk", "Goth",
  "Hard Rock", "Alternative", "Metal",
];

type Tab = "bandas" | "curadoria" | "adicionar" | "pagamentos" | "chat";

interface Band {
  id: string;
  username: string;
  genre: string | null;
  estado: string | null;
  avatar_url: string | null;
  is_suspended: boolean;
  user_type: string;
}

interface FeaturedItem {
  id: string;
  band_id: string;
  section_name: string;
  display_order: number;
  band?: { username: string; avatar_url: string | null };
}

const AdminPanel = () => {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("bandas");

  // Bands state
  const [bands, setBands] = useState<Band[]>([]);
  const [searchBand, setSearchBand] = useState("");
  const [loadingBands, setLoadingBands] = useState(false);

  // Featured state
  const [featured, setFeatured] = useState<FeaturedItem[]>([]);
  const [allBands, setAllBands] = useState<{ id: string; username: string }[]>([]);
  const [featBandId, setFeatBandId] = useState("");
  const [featSection, setFeatSection] = useState("destaque");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [savingBanner, setSavingBanner] = useState(false);
  const [sitePixKey, setSitePixKey] = useState("");
  const [savingPixKey, setSavingPixKey] = useState(false);

  // Manual add state
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newGenre, setNewGenre] = useState("");
  const [newEstado, setNewEstado] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newAvatarUrl, setNewAvatarUrl] = useState("");
  const [addingBand, setAddingBand] = useState(false);

  // Edit state
  const [editingBand, setEditingBand] = useState<Band | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editGenre, setEditGenre] = useState("");
  const [editEstado, setEditEstado] = useState("");

  // Payment requests state
  const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Chat monitoring state
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [viewingRoomId, setViewingRoomId] = useState<string | null>(null);
  const [viewingRoomMessages, setViewingRoomMessages] = useState<any[]>([]);
  const [viewingRoomParticipants, setViewingRoomParticipants] = useState<{ a: string; b: string }>({ a: "", b: "" });

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, adminLoading]);

  useEffect(() => {
    if (isAdmin) {
      loadBands();
      loadFeatured();
      loadBannerSetting();
      loadAllBands();
      loadPaymentRequests();
      loadSitePixKey();
      loadChatRooms();
    }
  }, [isAdmin]);

  const loadBands = async () => {
    setLoadingBands(true);
    let query = supabase.from("profiles").select("id, username, genre, estado, avatar_url, is_suspended, user_type").eq("user_type", "banda");
    if (searchBand) query = query.ilike("username", `%${searchBand}%`);
    const { data } = await query.order("created_at", { ascending: false });
    setBands((data as Band[]) || []);
    setLoadingBands(false);
  };

  const loadAllBands = async () => {
    const { data } = await supabase.from("profiles").select("id, username").eq("user_type", "banda").order("username");
    setAllBands(data || []);
  };

  const loadFeatured = async () => {
    const { data } = await supabase
      .from("home_featured")
      .select("id, band_id, section_name, display_order")
      .order("display_order");
    if (data) {
      // Load band names
      const bandIds = data.map(f => f.band_id);
      const { data: bandData } = await supabase.from("profiles").select("id, username, avatar_url").in("id", bandIds);
      const bandMap = new Map((bandData || []).map(b => [b.id, b]));
      setFeatured(data.map(f => ({ ...f, band: bandMap.get(f.band_id) })));
    }
  };

  const loadBannerSetting = async () => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "home_banner_url").maybeSingle();
    if (data) setBannerUrl(data.value);
  };

  const loadSitePixKey = async () => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "pix_key").maybeSingle();
    if (data) setSitePixKey(data.value);
  };

  const saveSitePixKey = async () => {
    setSavingPixKey(true);
    const { error } = await supabase.from("site_settings").upsert({ key: "pix_key", value: sitePixKey }, { onConflict: "key" });
    setSavingPixKey(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Chave Pix salva!" });
    }
  };

  const toggleSuspend = async (band: Band) => {
    await supabase.from("profiles").update({ is_suspended: !band.is_suspended }).eq("id", band.id);
    loadBands();
    toast({ title: band.is_suspended ? "Conta reativada" : "Conta suspensa" });
  };

  const deleteBand = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta banda?")) return;
    const { error } = await supabase.rpc("admin_delete_user", { _user_id: id });
    if (error) {
      toast({ title: "Erro ao excluir banda", description: error.message, variant: "destructive" });
      return;
    }
    loadBands();
    loadAllBands();
    toast({ title: "Banda excluída" });
  };

  const startEdit = (band: Band) => {
    setEditingBand(band);
    setEditUsername(band.username);
    setEditGenre(band.genre || "");
    setEditEstado(band.estado || "");
  };

  const saveEdit = async () => {
    if (!editingBand) return;
    await supabase.from("profiles").update({ username: editUsername, genre: editGenre, estado: editEstado }).eq("id", editingBand.id);
    setEditingBand(null);
    loadBands();
    loadAllBands();
    toast({ title: "Banda atualizada" });
  };

  const addFeatured = async () => {
    if (!featBandId) return;
    const maxOrder = featured.length > 0 ? Math.max(...featured.map(f => f.display_order)) + 1 : 0;
    await supabase.from("home_featured").insert({ band_id: featBandId, section_name: featSection, display_order: maxOrder });
    setFeatBandId("");
    loadFeatured();
    toast({ title: "Destaque adicionado" });
  };

  const removeFeatured = async (id: string) => {
    await supabase.from("home_featured").delete().eq("id", id);
    loadFeatured();
  };

  const moveFeatured = async (id: string, direction: "up" | "down") => {
    const idx = featured.findIndex(f => f.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= featured.length) return;
    const a = featured[idx];
    const b = featured[swapIdx];
    await Promise.all([
      supabase.from("home_featured").update({ display_order: b.display_order }).eq("id", a.id),
      supabase.from("home_featured").update({ display_order: a.display_order }).eq("id", b.id),
    ]);
    loadFeatured();
  };

  const uploadBanner = async () => {
    if (!bannerFile) return;
    setSavingBanner(true);
    const ext = bannerFile.name.split(".").pop();
    const path = `banner.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("site-assets").upload(path, bannerFile, { upsert: true });
    if (uploadErr) {
      toast({ title: "Erro no upload", description: uploadErr.message, variant: "destructive" });
      setSavingBanner(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(path);
    const url = urlData.publicUrl + "?t=" + Date.now();

    // Upsert site_settings
    const { error: settErr } = await supabase.from("site_settings").upsert({ key: "home_banner_url", value: url }, { onConflict: "key" });
    if (settErr) {
      toast({ title: "Erro ao salvar", description: settErr.message, variant: "destructive" });
    } else {
      setBannerUrl(url);
      toast({ title: "Banner atualizado!" });
    }
    setSavingBanner(false);
  };

  // --- Payment Requests ---
  const loadPaymentRequests = async () => {
    setLoadingPayments(true);
    const { data } = await supabase
      .from("payment_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (data && data.length > 0) {
      const bandIds = [...new Set(data.map((r: any) => r.band_id))];
      const { data: bands } = await supabase.from("profiles").select("id, username").in("id", bandIds);
      const bandMap = new Map((bands || []).map((b) => [b.id, b.username]));
      setPaymentRequests(data.map((r: any) => ({ ...r, band_name: bandMap.get(r.band_id) || "?" })));
    } else {
      setPaymentRequests([]);
    }
    setLoadingPayments(false);
  };

  // Comprovantes ficam num bucket PRIVADO: abrimos por um link temporário (5 min).
  const openProof = async (proof: string) => {
    const marker = "/payment-proofs/";
    let path = proof;
    if (/^https?:\/\//i.test(proof)) {
      const i = proof.indexOf(marker);
      if (i === -1) {
        window.open(proof, "_blank", "noopener,noreferrer");
        return;
      }
      path = decodeURIComponent(proof.slice(i + marker.length).split("?")[0]);
    }
    const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(path, 300);
    if (error || !data?.signedUrl) {
      toast({ title: "Não foi possível abrir o comprovante", description: error?.message, variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const approvePayment = async (requestId: string) => {
    const { error } = await supabase.rpc("approve_payment_request", { _request_id: requestId });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Pagamento aprovado e slots liberados!" });
      loadPaymentRequests();
    }
  };

  const rejectPayment = async (requestId: string) => {
    const { error } = await supabase
      .from("payment_requests")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() } as any)
      .eq("id", requestId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Solicitação rejeitada" });
      loadPaymentRequests();
    }
  };

  // --- Chat Monitoring ---
  const loadChatRooms = async () => {
    setLoadingChats(true);
    const { data } = await supabase
      .from("chat_rooms")
      .select("*")
      .order("created_at", { ascending: false });
    if (data && data.length > 0) {
      const userIds = [...new Set(data.flatMap((r: any) => [r.participant_a, r.participant_b]))];
      const productIds = data.map((r: any) => r.product_id).filter(Boolean);
      const [profilesRes, productsRes] = await Promise.all([
        supabase.from("profiles").select("id, username").in("id", userIds),
        productIds.length > 0 ? supabase.from("products").select("id, title").in("id", productIds) : { data: [] },
      ]);
      const profileMap = new Map((profilesRes.data || []).map((p) => [p.id, p.username]));
      const productMap = new Map(((productsRes.data || []) as any[]).map((p) => [p.id, p.title]));
      setChatRooms(data.map((r: any) => ({
        ...r,
        name_a: profileMap.get(r.participant_a) || "?",
        name_b: profileMap.get(r.participant_b) || "?",
        product_title: r.product_id ? productMap.get(r.product_id) : null,
      })));
    } else {
      setChatRooms([]);
    }
    setLoadingChats(false);
  };

  const viewChatRoom = async (room: any) => {
    setViewingRoomId(room.id);
    setViewingRoomParticipants({ a: room.name_a, b: room.name_b });
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", room.id)
      .order("created_at", { ascending: true })
      .limit(500);
    if (data) {
      const senderIds = [...new Set(data.map((m: any) => m.sender_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, username").in("id", senderIds);
      const nameMap = new Map((profiles || []).map((p) => [p.id, p.username]));
      setViewingRoomMessages(data.map((m: any) => ({ ...m, sender_name: nameMap.get(m.sender_id) || "?" })));
    }
  };

  const banUser = async (userId: string, username: string) => {
    if (!confirm(`Tem certeza que deseja BANIR o usuário "${username}"? O perfil será excluído.`)) return;
    const { error } = await supabase.rpc("admin_delete_user", { _user_id: userId });
    if (error) {
      toast({ title: "Erro ao banir usuário", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Usuário "${username}" banido e conta excluída.` });
    setViewingRoomId(null);
    loadChatRooms();
  };

  const addBandManually = async () => {
    const username = newUsername.trim();
    const email = newEmail.trim();
    if (!username || !email || !newPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome da banda, o e-mail e a senha.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Senha muito curta",
        description: "A senha precisa ter pelo menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setAddingBand(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("admin-setup", {
        body: {
          action: "create-user",
          email,
          password: newPassword,
          username,
          role: "user",
          genre: newGenre,
          estado: newEstado,
          bio: newBio,
          avatar_url: newAvatarUrl.trim(),
        },
      });

      if (invokeError) {
        let message = invokeError.message || "Não foi possível chamar o serviço de cadastro.";
        const context = (invokeError as any).context;
        if (context && typeof context.clone === "function") {
          try {
            const responseBody = await context.clone().json();
            if (responseBody?.error) message = responseBody.error;
          } catch {
            // Mantém a mensagem original caso a resposta não seja JSON.
          }
        }
        throw new Error(message);
      }

      if (data?.error) throw new Error(data.error);
      if (!data?.success || !data?.user_id) {
        throw new Error("O serviço não confirmou a criação da conta. Nenhum sucesso foi informado.");
      }

      toast({ title: "Banda cadastrada!", description: "A conta já pode entrar usando o e-mail e a senha definidos." });
      setNewUsername("");
      setNewEmail("");
      setNewPassword("");
      setNewGenre("");
      setNewEstado("");
      setNewBio("");
      setNewAvatarUrl("");
      await Promise.all([loadBands(), loadAllBands()]);
      setTab("bandas");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido ao cadastrar a banda.";
      toast({ title: "Não foi possível cadastrar a banda", description: message, variant: "destructive" });
    } finally {
      setAddingBand(false);
    }
  };

  if (adminLoading) return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Verificando permissões...</p></div>;
  if (!isAdmin) return null;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <h1 className="font-display text-3xl md:text-4xl text-foreground">ADMINISTRAÇÃO</h1>
        </div>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 h-9 px-4 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 text-sm font-medium transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {([
          { id: "bandas" as Tab, label: "Bandas", icon: Users },
          { id: "curadoria" as Tab, label: "Curadoria", icon: Star },
          { id: "pagamentos" as Tab, label: "Pagamentos", icon: CreditCard },
          { id: "chat" as Tab, label: "Monitoramento", icon: MessageCircle },
          { id: "adicionar" as Tab, label: "Adicionar Banda", icon: Plus },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors relative ${
              tab === id ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {tab === id && <div className="absolute bottom-0 left-0 right-0 h-0.5 gradient-rock rounded-full" />}
          </button>
        ))}
      </div>

      {/* TAB: Bandas */}
      {tab === "bandas" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={searchBand}
                onChange={(e) => setSearchBand(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadBands()}
                placeholder="Buscar banda..."
                className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <button onClick={loadBands} className="h-9 px-4 rounded-lg gradient-rock text-primary-foreground text-xs font-semibold">Buscar</button>
          </div>

          {/* Edit modal */}
          {editingBand && (
            <div className="p-4 rounded-xl border border-primary/30 bg-card space-y-3">
              <p className="text-sm font-semibold text-foreground">Editando: {editingBand.username}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} placeholder="Nome" className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:border-primary" />
                <select value={editGenre} onChange={(e) => setEditGenre(e.target.value)} className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground cursor-pointer">
                  <option value="">Gênero</option>
                  {genres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <select value={editEstado} onChange={(e) => setEditEstado(e.target.value)} className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground cursor-pointer">
                  <option value="">Estado</option>
                  {estados.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit} className="h-8 px-4 rounded-lg gradient-rock text-primary-foreground text-xs font-semibold">Salvar</button>
                <button onClick={() => setEditingBand(null)} className="h-8 px-4 rounded-lg border border-border text-muted-foreground text-xs">Cancelar</button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {bands.map((band) => (
              <div key={band.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${band.is_suspended ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"}`}>
                {band.avatar_url ? (
                  <img src={band.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full gradient-rock flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary-foreground">{band.username[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {band.username}
                    {band.is_suspended && <span className="ml-2 text-xs text-destructive">(Suspensa)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{[band.genre, band.estado].filter(Boolean).join(" • ") || "Sem info"}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => navigate(`/dashboard?bandId=${band.id}`)} className="p-1.5 rounded text-muted-foreground hover:text-primary transition-colors" title="Gerenciar perfil, conteúdo e eventos">
                    <Settings className="h-4 w-4" />
                  </button>
                  <button onClick={() => startEdit(band)} className="p-1.5 rounded text-muted-foreground hover:text-primary transition-colors" title="Editar rápido">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => toggleSuspend(band)} className="p-1.5 rounded text-muted-foreground hover:text-accent transition-colors" title={band.is_suspended ? "Reativar" : "Suspender"}>
                    <Ban className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteBand(band.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors" title="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {!loadingBands && bands.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma banda encontrada.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB: Curadoria */}
      {tab === "curadoria" && (
        <div className="space-y-6">
          {/* Banner */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl text-foreground">BANNER DA HOME</h2>
            </div>
            {bannerUrl && (
              <img src={bannerUrl} alt="Banner atual" className="w-full h-40 object-cover rounded-lg" />
            )}
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
                className="text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground hover:file:opacity-90"
              />
              <button
                onClick={uploadBanner}
                disabled={!bannerFile || savingBanner}
                className="h-9 px-5 rounded-lg gradient-rock text-primary-foreground text-xs font-semibold disabled:opacity-50"
              >
                {savingBanner ? "Enviando..." : "Salvar Banner"}
              </button>
            </div>
          </section>
          {/* Site PIX Key */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl text-foreground">CHAVE PIX DO SITE</h2>
            </div>
            <p className="text-xs text-muted-foreground">Chave exibida no modal de contribuição do marketplace.</p>
            <div className="flex items-center gap-3">
              <input
                value={sitePixKey}
                onChange={(e) => setSitePixKey(e.target.value)}
                placeholder="email@pix.com ou chave"
                className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
              <button
                onClick={saveSitePixKey}
                disabled={savingPixKey}
                className="h-9 px-5 rounded-lg gradient-rock text-primary-foreground text-xs font-semibold disabled:opacity-50"
              >
                {savingPixKey ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </section>

          {/* Featured bands */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl text-foreground">DESTAQUES</h2>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={featBandId}
                onChange={(e) => setFeatBandId(e.target.value)}
                className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground cursor-pointer"
              >
                <option value="">Selecione uma banda</option>
                {allBands.map(b => <option key={b.id} value={b.id}>{b.username}</option>)}
              </select>
              <select
                value={featSection}
                onChange={(e) => setFeatSection(e.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground cursor-pointer"
              >
                <option value="destaque">Destaque</option>
                <option value="novidades">Novidades</option>
                <option value="top">Top</option>
              </select>
              <button onClick={addFeatured} disabled={!featBandId} className="h-9 px-4 rounded-lg gradient-rock text-primary-foreground text-xs font-semibold disabled:opacity-50">
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              {featured.map((item, i) => (
                <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-background">
                  <span className="w-6 text-center text-xs font-bold text-muted-foreground">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.band?.username || "..."}</p>
                    <p className="text-xs text-muted-foreground">{item.section_name}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => moveFeatured(item.id, "up")} disabled={i === 0} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button onClick={() => moveFeatured(item.id, "down")} disabled={i === featured.length - 1} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                    <button onClick={() => removeFeatured(item.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
              {featured.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum destaque configurado.</p>}
            </div>
          </section>
        </div>
      )}

      {/* TAB: Pagamentos */}
      {tab === "pagamentos" && (
        <div className="space-y-4">
          <h2 className="font-display text-xl text-foreground">SOLICITAÇÕES DE PAGAMENTO</h2>
          {paymentRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma solicitação pendente.</p>
          ) : (
            <div className="space-y-2">
              {paymentRequests.map((req) => (
                <div key={req.id} className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
                  <CreditCard className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{req.band_name} — {req.slots_requested} slot(s)</p>
                    <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString("pt-BR")}</p>
                    <button type="button" onClick={() => openProof(req.proof_url)} className="text-xs text-primary hover:underline">Ver comprovante</button>
                  </div>
                  {req.status === "pending" ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => approvePayment(req.id)} className="p-2 rounded text-green-400 hover:bg-green-500/10 transition-colors" title="Aprovar">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => rejectPayment(req.id)} className="p-2 rounded text-destructive hover:bg-destructive/10 transition-colors" title="Rejeitar">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      req.status === "approved" ? "bg-green-500/20 text-green-400" : "bg-destructive/20 text-destructive"
                    }`}>
                      {req.status === "approved" ? "Aprovado" : "Rejeitado"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Adicionar Banda */}
      {tab === "adicionar" && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 max-w-lg">
          <h2 className="font-display text-xl text-foreground">CADASTRAR BANDA MANUALMENTE</h2>

          <div className="space-y-3">
            <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Nome da banda *" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
            <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email *" type="email" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
            <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Senha *" type="password" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
            <div className="grid grid-cols-2 gap-3">
              <select value={newGenre} onChange={(e) => setNewGenre(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground cursor-pointer">
                <option value="">Gênero</option>
                {genres.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={newEstado} onChange={(e) => setNewEstado(e.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground cursor-pointer">
                <option value="">Estado</option>
                {estados.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
            <textarea value={newBio} onChange={(e) => setNewBio(e.target.value)} placeholder="Bio" rows={3} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none" />
            <input value={newAvatarUrl} onChange={(e) => setNewAvatarUrl(e.target.value)} placeholder="URL do Avatar" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
          </div>

          <button
            onClick={addBandManually}
            disabled={addingBand || !newUsername || !newEmail || !newPassword}
            className="flex items-center gap-2 h-10 px-6 rounded-lg gradient-rock text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {addingBand ? "Cadastrando..." : "Cadastrar Banda"}
          </button>
        </div>
      )}

      {/* TAB: Chat Monitoring */}
      {tab === "chat" && (
        <div className="space-y-4">
          <h2 className="font-display text-xl text-foreground">CENTRAL DE MONITORAMENTO</h2>

          {viewingRoomId ? (
            <div className="space-y-3">
              <button
                onClick={() => setViewingRoomId(null)}
                className="text-sm text-primary hover:underline"
              >
                ← Voltar às salas
              </button>
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {viewingRoomParticipants.a} ↔ {viewingRoomParticipants.b}
                  </p>
                </div>
                <div className="max-h-[400px] overflow-y-auto space-y-2 border border-border rounded-lg p-3 bg-background">
                  {viewingRoomMessages.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Nenhuma mensagem.</p>
                  ) : (
                    viewingRoomMessages.map((msg: any) => (
                      <div key={msg.id} className="flex items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">{msg.sender_name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(msg.created_at).toLocaleString("pt-BR")}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{msg.text}</p>
                        </div>
                        <button
                          onClick={() => banUser(msg.sender_id, msg.sender_name)}
                          className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                          title="Banir este usuário"
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {loadingChats ? (
                <p className="text-sm text-muted-foreground">Carregando salas...</p>
              ) : chatRooms.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma sala de chat criada.</p>
              ) : (
                <div className="space-y-1">
                  {chatRooms.map((room: any) => (
                    <div key={room.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                      <MessageCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {room.name_a} ↔ {room.name_b}
                        </p>
                        {room.product_title && (
                          <p className="text-xs text-muted-foreground truncate">Produto: {room.product_title}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(room.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <button
                        onClick={() => viewChatRoom(room)}
                        className="flex items-center gap-1 h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
