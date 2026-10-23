import { useState, useEffect } from "react";
import { Heart, Send, ImagePlus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Post {
  id: string;
  artist_id: string;
  text: string;
  image_url: string | null;
  created_at: string;
  likes_count: number;
  liked_by_me: boolean;
}

interface PostsFeedProps {
  artistId: string;
  isOwner: boolean;
}

export function PostsFeed({ artistId, isOwner }: PostsFeedProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newText, setNewText] = useState("");
  const [newImage, setNewImage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
    const channel = supabase
      .channel(`posts-${artistId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "posts", filter: `artist_id=eq.${artistId}` }, () => loadPosts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [artistId, user]);

  const loadPosts = async () => {
    const { data: rawPosts } = await supabase
      .from("posts")
      .select("*")
      .eq("artist_id", artistId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (!rawPosts) { setLoading(false); return; }

    const postIds = rawPosts.map((p) => p.id);

    // Get like counts
    const { data: likeCounts } = await supabase
      .from("post_likes")
      .select("post_id")
      .in("post_id", postIds);

    // Get my likes
    let myLikes: string[] = [];
    if (user) {
      const { data: ml } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds);
      myLikes = (ml || []).map((l) => l.post_id);
    }

    const countMap: Record<string, number> = {};
    (likeCounts || []).forEach((l) => {
      countMap[l.post_id] = (countMap[l.post_id] || 0) + 1;
    });

    const enriched: Post[] = rawPosts.map((p) => ({
      ...p,
      likes_count: countMap[p.id] || 0,
      liked_by_me: myLikes.includes(p.id),
    }));
    setPosts(enriched);
    setLoading(false);
  };

  const createPost = async () => {
    if (!newText.trim() && !newImage.trim()) return;
    const { error } = await supabase.from("posts").insert({
      artist_id: artistId,
      text: newText.trim(),
      image_url: newImage.trim() || null,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setNewText("");
      setNewImage("");
    }
  };

  const toggleLike = async (postId: string, liked: boolean) => {
    if (!user) return;
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
    }
    loadPosts();
  };

  const deletePost = async (postId: string) => {
    await supabase.from("posts").delete().eq("id", postId);
    loadPosts();
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Post composer */}
      {isOwner && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value.slice(0, 1000))}
            placeholder="Poste uma atualização para seus fãs..."
            rows={3}
            maxLength={1000}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
          />
          <input
            value={newImage}
            onChange={(e) => setNewImage(e.target.value)}
            placeholder="URL da imagem (opcional)"
            className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={createPost}
            disabled={!newText.trim() && !newImage.trim()}
            className="flex items-center gap-2 h-9 px-5 rounded-lg gradient-rock text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Publicar
          </button>
        </div>
      )}

      {/* Posts list */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma publicação ainda.</p>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="rounded-xl border border-border bg-card overflow-hidden">
            {post.image_url && (
              <img src={post.image_url} alt="" className="w-full max-h-80 object-cover" />
            )}
            <div className="p-4">
              <p className="text-sm text-foreground whitespace-pre-wrap">{post.text}</p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  {user ? (
                    <button
                      onClick={() => toggleLike(post.id, post.liked_by_me)}
                      className={`flex items-center gap-1.5 text-sm transition-colors ${
                        post.liked_by_me ? "text-primary" : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${post.liked_by_me ? "fill-primary" : ""}`} />
                      {post.likes_count > 0 && post.likes_count}
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Heart className="h-4 w-4" />
                      {post.likes_count > 0 && post.likes_count}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
                  {isOwner && (
                    <button onClick={() => deletePost(post.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
