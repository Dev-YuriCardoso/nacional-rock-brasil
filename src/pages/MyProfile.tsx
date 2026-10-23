import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Music, Video, Settings, Camera, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { toEmbed } from "@/lib/embedUtils";
import { UserBadges } from "@/components/UserBadges";

interface FollowedBand {
  id: string;
  username: string;
  avatar_url: string | null;
  genre: string | null;
  estado: string | null;
}

interface UpdateItem {
  id: string;
  title: string;
  url: string;
  type: "spotify_link" | "youtube_link" | "bandcamp_link" | "soundcloud_link";
  created_at: string;
  artist_id: string;
  artist_name?: string;
  artist_avatar?: string | null;
}

const tabs = ["Minhas Bandas", "Conquistas", "Atualizações", "Configurações"] as const;

const MyProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Minhas Bandas");
  const [followedBands, setFollowedBands] = useState<FollowedBand[]>([]);
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings state
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadFollowedBands();
    loadProfile();
  }, [user]);

  useEffect(() => {
    if (followedBands.length > 0 && activeTab === "Atualizações") {
      loadUpdates();
    }
  }, [followedBands, activeTab]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .single();
    if (data) {
      setUsername(data.username);
      setAvatarUrl(data.avatar_url);
    }
  };

  const loadFollowedBands = async () => {
    if (!user) return;
    setLoading(true);
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    if (follows && follows.length > 0) {
      const ids = follows.map((f) => f.following_id);
      const { data: bands } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, genre, estado")
        .in("id", ids);
      if (bands) setFollowedBands(bands);
    } else {
      setFollowedBands([]);
    }
    setLoading(false);
  };

  const loadUpdates = async () => {
    if (followedBands.length === 0) return;
    const ids = followedBands.map((b) => b.id);
    const { data } = await supabase
      .from("content")
      .select("*")
      .in("artist_id", ids)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      const enriched = data.map((item) => {
        const band = followedBands.find((b) => b.id === item.artist_id);
        return { ...item, artist_name: band?.username, artist_avatar: band?.avatar_url };
      });
      setUpdates(enriched);
    }
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    } else {
      const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(path);
      setAvatarUrl(urlData.publicUrl + "?t=" + Date.now());
    }
    setUploading(false);
  };

  const saveSettings = async () => {
    if (!user || !username.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ username: username.trim(), avatar_url: avatarUrl })
      .eq("id", user.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!" });
    }
    setSaving(false);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  if (!user) return null;

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="px-4 md:px-8 pt-8 pb-4">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full border-2 border-primary object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-full border-2 border-primary gradient-rock flex items-center justify-center">
              <span className="font-display text-xl text-primary-foreground">
                {(username || "U")[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="font-display text-3xl text-foreground">{username || "Meu Perfil"}</h1>
            <p className="text-sm text-muted-foreground">
              Seguindo {followedBands.length} banda{followedBands.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-8">
        <div className="flex gap-1 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors relative ${
                activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 gradient-rock rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {/* Minhas Bandas */}
          {activeTab === "Minhas Bandas" && (
            <div>
              {loading ? (
                <p className="text-muted-foreground text-sm text-center py-8">Carregando...</p>
              ) : followedBands.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Você ainda não segue nenhuma banda.</p>
                  <button
                    onClick={() => navigate("/artistas")}
                    className="mt-4 px-5 py-2 rounded-lg gradient-rock text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Explorar Bandas
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {followedBands.map((band) => (
                    <button
                      key={band.id}
                      onClick={() => navigate(`/artista/${band.id}`)}
                      className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:bg-card/80 transition-all text-center"
                    >
                      {band.avatar_url ? (
                        <img src={band.avatar_url} alt={band.username} className="h-20 w-20 rounded-full object-cover border-2 border-transparent group-hover:border-primary transition-colors" />
                      ) : (
                        <div className="h-20 w-20 rounded-full gradient-rock flex items-center justify-center border-2 border-transparent group-hover:border-primary transition-colors">
                          <span className="font-display text-2xl text-primary-foreground">{band.username[0]?.toUpperCase()}</span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-foreground truncate max-w-[120px]">{band.username}</p>
                        {band.genre && <p className="text-xs text-muted-foreground truncate max-w-[120px]">{band.genre}</p>}
                        {band.estado && <p className="text-xs text-primary">{band.estado}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conquistas */}
          {activeTab === "Conquistas" && user && (
            <UserBadges userId={user.id} />
          )}

          {/* Atualizações */}
          {activeTab === "Atualizações" && (
            <div className="space-y-4 max-w-2xl">
              {followedBands.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Siga bandas para ver atualizações aqui.</p>
              ) : updates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atualização recente.</p>
              ) : (
                updates.map((item) => {
                  const embed = toEmbed(item.url);
                  return (
                    <div key={item.id} className="rounded-xl border border-border bg-card overflow-hidden">
                      <div className="p-3 flex items-center gap-3">
                        {item.artist_avatar ? (
                          <img src={item.artist_avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="h-8 w-8 rounded-full gradient-rock flex items-center justify-center">
                            <span className="text-xs font-bold text-primary-foreground">{item.artist_name?.[0]?.toUpperCase()}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <button onClick={() => navigate(`/artista/${item.artist_id}`)} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                            {item.artist_name}
                          </button>
                          <p className="text-xs text-muted-foreground">publicou · {timeAgo(item.created_at)}</p>
                        </div>
                        {item.type === "spotify_link" ? (
                          <Music className="h-4 w-4 text-accent flex-shrink-0" />
                        ) : (
                          <Video className="h-4 w-4 text-destructive flex-shrink-0" />
                        )}
                      </div>
                      <div className="px-3 pb-2">
                        <p className="text-sm text-foreground font-medium">{item.title}</p>
                      </div>
                      {embed && item.type === "youtube_link" && (
                        <div className="aspect-video">
                          <iframe className="w-full h-full border-0" src={embed.embedUrl} title={item.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                        </div>
                      )}
                      {embed && item.type === "spotify_link" && (
                        <iframe src={embed.embedUrl} width="100%" height="80" allow="encrypted-media" className="border-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Configurações */}
          {activeTab === "Configurações" && (
            <div className="max-w-md space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-24 w-24 rounded-full object-cover border-2 border-primary" />
                  ) : (
                    <div className="h-24 w-24 rounded-full gradient-rock flex items-center justify-center border-2 border-primary">
                      <span className="font-display text-3xl text-primary-foreground">{(username || "U")[0]?.toUpperCase()}</span>
                    </div>
                  )}
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
                </div>
                <p className="text-xs text-muted-foreground">Clique no ícone para alterar a foto</p>
              </div>

              {/* Username */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nome de usuário</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.slice(0, 100))}
                  maxLength={100}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <button
                onClick={saveSettings}
                disabled={saving || !username.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg gradient-rock text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
