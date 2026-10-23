import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MessageCircle, Send, Music, Video, Heart, UserPlus, UserCheck, MapPin, Copy, QrCode, Lock, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { toEmbed } from "@/lib/embedUtils";
import { SmartPlayer } from "@/components/SmartPlayer";
import { PostsFeed } from "@/components/PostsFeed";
import { Link } from "react-router-dom";
import { ChatRoom } from "@/components/ChatRoom";
import { useChatRoom } from "@/hooks/useChatRoom";

interface Profile {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  genre: string | null;
  subgenre: string | null;
  estado: string | null;
  pix_link: string | null;
  pix_qrcode_url: string | null;
}

interface ContentItem {
  id: string;
  type: "spotify_link" | "youtube_link" | "bandcamp_link" | "soundcloud_link";
  url: string;
  title: string;
  is_exclusive: boolean;
}

interface Comment {
  id: string;
  username: string;
  text: string;
  created_at: string;
  user_id: string;
}

const tabs = ["Músicas", "Vídeos", "Mural", "Loja", "Comentários"] as const;

const ArtistDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>("Mural");
  const [artist, setArtist] = useState<Profile | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [artistProducts, setArtistProducts] = useState<any[]>([]);
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [activeChatName, setActiveChatName] = useState("");
  const { openOrCreateRoom } = useChatRoom();

  const handleBuyProduct = async (product: any) => {
    if (!id) return;
    const result = await openOrCreateRoom(id, product.id);
    if (result) {
      setActiveChatRoomId(result.roomId);
      setActiveChatName(result.bandUsername);
    }
  };
  useEffect(() => {
    if (!id) return;
    loadArtist();
    loadContent();
    loadComments();
    loadFollowersCount();
    loadArtistProducts();

    // Real-time comments
    const channel = supabase
      .channel(`comments-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments", filter: `artist_id=eq.${id}` },
        (payload) => {
          setComments((prev) => [payload.new as Comment, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  useEffect(() => {
    if (!id || !user) return;
    checkFollowStatus();
  }, [id, user]);

  const checkFollowStatus = async () => {
    if (!user || !id) return;
    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", id)
      .maybeSingle();
    setIsFollowing(!!data);
  };

  const loadFollowersCount = async () => {
    if (!id) return;
    const { count } = await supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", id);
    setFollowersCount(count || 0);
  };

  const toggleFollow = async () => {
    if (!user || !id) return;
    setFollowLoading(true);
    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", id);
      setIsFollowing(false);
      setFollowersCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: id });
      setIsFollowing(true);
      setFollowersCount((c) => c + 1);
    }
    setFollowLoading(false);
  };

  const copyPix = async () => {
    if (!artist?.pix_link) return;
    await navigator.clipboard.writeText(artist.pix_link);
    toast({ title: "Chave Pix copiada!" });
  };

  const loadArtist = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, bio, avatar_url, banner_url, genre, subgenre, estado, pix_link, pix_qrcode_url")
      .eq("id", id!)
      .single();
    if (data) setArtist(data);
    setLoading(false);
  };

  const loadContent = async () => {
    const { data } = await supabase
      .from("content")
      .select("*")
      .eq("artist_id", id!)
      .order("created_at", { ascending: false });
    if (data) setContents(data);
  };

  const loadComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("artist_id", id!)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setComments(data);
  };

  const postComment = async () => {
    if (!user || !newComment.trim() || !id) return;
    const commentText = newComment.trim().slice(0, 500);
    const { error } = await supabase
      .from("comments")
      .insert({ artist_id: id, user_id: user.id, username: "auto", text: commentText });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setNewComment("");
    }
  };

  const spotifyContent = contents.filter((c) => c.type === "spotify_link" || c.type === "bandcamp_link" || c.type === "soundcloud_link");
  const youtubeContent = contents.filter((c) => c.type === "youtube_link");

  const loadArtistProducts = async () => {
    if (!id) return;
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("owner_id", id)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (data) setArtistProducts(data);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Carregando...</p></div>;
  }

  if (!artist) {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-muted-foreground">Artista não encontrado.</p></div>;
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m atrás`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h atrás`;
    return `${Math.floor(hrs / 24)}d atrás`;
  };

  return (
    <div className="pb-8">
      {/* Cover Header */}
      <div className="relative h-64 md:h-80">
        {artist.banner_url ? (
          <img src={artist.banner_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/30 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-5">
          <div className="flex items-end gap-5">
            {artist.avatar_url ? (
              <img src={artist.avatar_url} alt={artist.username} className="h-28 w-28 rounded-full border-4 border-primary object-cover glow-red" />
            ) : (
              <div className="h-28 w-28 rounded-full border-4 border-primary gradient-rock flex items-center justify-center glow-red">
                <span className="font-display text-3xl text-primary-foreground">{artist.username[0]?.toUpperCase()}</span>
              </div>
            )}
            <div>
              <h1 className="font-display text-4xl md:text-5xl text-foreground">{artist.username}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {artist.genre && (
                  <span className="text-muted-foreground text-sm">{artist.genre}{artist.subgenre ? ` / ${artist.subgenre}` : ''}</span>
                )}
                {artist.estado && (
                  <span className="flex items-center gap-1 text-sm text-primary">
                    <MapPin className="h-3.5 w-3.5" />
                    {artist.estado}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{followersCount} seguidores</span>
            </div>
          </div>
          {user && user.id !== id && (
            <button
              onClick={toggleFollow}
              disabled={followLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isFollowing
                  ? "bg-muted text-foreground hover:bg-destructive/20 hover:text-destructive"
                  : "gradient-rock text-primary-foreground hover:opacity-90"
              }`}
            >
              {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {isFollowing ? "Seguindo" : "Seguir"}
            </button>
          )}
        </div>
      </div>

      {/* Estado destaque */}
      {artist.estado && artist.genre && (
        <div className="px-4 md:px-8 mt-4">
          <p className="text-sm font-medium text-foreground">
            Banda de {artist.genre} — <span className="text-primary">{artist.estado}</span>
          </p>
        </div>
      )}

      {/* Bio */}
      {artist.bio && (
        <div className="px-4 md:px-8 mt-6">
          <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">{artist.bio}</p>
        </div>
      )}

      {/* Fortaleça a Cena - Pix */}
      {(artist.pix_link || artist.pix_qrcode_url) && (
        <div className="px-4 md:px-8 mt-6">
          <div className="max-w-sm rounded-xl border border-primary/30 bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="h-5 w-5 text-primary" />
              <h3 className="font-display text-lg text-foreground">Fortaleça a Cena</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Apoie essa banda via Pix!</p>
            {artist.pix_qrcode_url && (
              <div className="flex justify-center mb-4">
                <img src={artist.pix_qrcode_url} alt="QR Code Pix" className="h-40 w-40 rounded-lg border border-border" />
              </div>
            )}
            {artist.pix_link && (
              <button
                onClick={copyPix}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-primary/50 text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
              >
                <Copy className="h-4 w-4" />
                Copiar Chave Pix
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 md:px-8 mt-8">
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
          {activeTab === "Mural" && (
            <PostsFeed artistId={id!} isOwner={!!user && user.id === id} />
          )}

          {activeTab === "Músicas" && (
            <div className="space-y-3">
              {spotifyContent.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma música adicionada ainda.</p>
              ) : (
                spotifyContent.map((item) => {
                  const embed = toEmbed(item.url);
                  return (
                    <div key={item.id} className="rounded-xl overflow-hidden border border-border bg-card">
                      <div className="p-3 flex items-center gap-2">
                        <Music className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                      </div>
                      {embed && (
                        <SmartPlayer type={embed.type} embedUrl={embed.embedUrl} title={item.title} artistName={artist.username} />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "Vídeos" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {youtubeContent.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center col-span-2">Nenhum vídeo adicionado ainda.</p>
              ) : (
                youtubeContent.map((item) => {
                  const embed = toEmbed(item.url);
                  const locked = item.is_exclusive && (!user || (!isFollowing && user?.id !== id));
                  return (
                    <div key={item.id} className="rounded-xl overflow-hidden bg-card border border-border">
                      {locked ? (
                        <div className="aspect-video bg-muted flex flex-col items-center justify-center gap-2">
                          <Lock className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground font-medium">Exclusivo para seguidores</p>
                          {!user && <a href="/auth" className="text-xs text-primary hover:underline">Faça login e siga para assistir</a>}
                        </div>
                      ) : (
                        embed && (
                          <div className="aspect-video">
                            <iframe className="w-full h-full" src={embed.embedUrl} title={item.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                          </div>
                        )
                      )}
                      <div className="p-3 flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        {item.is_exclusive && <Lock className="h-3.5 w-3.5 text-primary" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "Loja" && (
            <div>
              {artistProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Nenhum produto à venda no momento.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {artistProducts.map((product) => (
                    <div key={product.id} className="group rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 transition-colors">
                      <div className="aspect-square bg-muted relative overflow-hidden">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
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
                      <div className="p-3 space-y-1">
                        <p className="text-sm font-medium text-foreground truncate">{product.title}</p>
                        {product.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                        )}
                        <p className="text-base font-bold text-primary">
                          R$ {Number(product.price).toFixed(2).replace(".", ",")}
                        </p>
                        {user && user.id !== id && (
                          <button
                            onClick={() => handleBuyProduct(product)}
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
            </div>
          )}

          {activeTab === "Comentários" && (
            <div className="space-y-4 max-w-2xl">
              {/* Post comment */}
              {user ? (
                <div className="flex gap-3 p-4 rounded-xl bg-card border border-border">
                  <div className="h-9 w-9 rounded-full gradient-rock flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary-foreground">
                      {(user.user_metadata?.username || user.email || "U")[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value.slice(0, 500))}
                      onKeyDown={(e) => e.key === "Enter" && postComment()}
                      placeholder="Escreva um comentário..."
                      maxLength={500}
                      className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                    <button
                      onClick={postComment}
                      disabled={!newComment.trim()}
                      className="h-9 w-9 rounded-lg gradient-rock flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  <a href="/auth" className="text-primary hover:underline">Faça login</a> para comentar.
                </p>
              )}

              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-4 rounded-xl bg-card border border-border">
                  <div className="h-9 w-9 rounded-full gradient-rock flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground">{comment.username}</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.text}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum comentário ainda. Seja o primeiro!</p>
              )}
            </div>
          )}
        </div>
      </div>

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

export default ArtistDetail;
