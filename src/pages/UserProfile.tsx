import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Heart, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UserBadges } from "@/components/UserBadges";

interface UserData {
  id: string;
  username: string;
  avatar_url: string | null;
  user_type: "fã" | "banda";
}

interface FollowedBand {
  id: string;
  username: string;
  avatar_url: string | null;
  genre: string | null;
}

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [followedBands, setFollowedBands] = useState<FollowedBand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadUser();
  }, [id]);

  const loadUser = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, user_type")
      .eq("id", id!)
      .single();

    if (data) {
      // If it's a band, redirect to artist page
      if (data.user_type === "banda") {
        navigate(`/artista/${data.id}`, { replace: true });
        return;
      }
      setUserData(data);
      await loadFollowedBands();
    }
    setLoading(false);
  };

  const loadFollowedBands = async () => {
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", id!);

    if (follows && follows.length > 0) {
      const ids = follows.map((f) => f.following_id);
      const { data: bands } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, genre")
        .in("id", ids);
      if (bands) setFollowedBands(bands);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Usuário não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span>→</span>
        <Link to="/buscar" className="hover:text-primary transition-colors">Buscar</Link>
        <span>→</span>
        <span className="text-foreground">{userData.username}</span>
      </div>

      {/* Profile Header */}
      <div className="flex items-center gap-5">
        {userData.avatar_url ? (
          <img
            src={userData.avatar_url}
            alt={userData.username}
            className="h-24 w-24 rounded-full border-2 border-primary object-cover"
          />
        ) : (
          <div className="h-24 w-24 rounded-full border-2 border-primary gradient-rock flex items-center justify-center">
            <span className="font-display text-3xl text-primary-foreground">
              {userData.username[0]?.toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-foreground">{userData.username}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Seguindo {followedBands.length} banda{followedBands.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Badges */}
      {userData && <UserBadges userId={userData.id} />}

      {/* Followed Bands */}
      <section>
        <h2 className="font-display text-xl text-foreground mb-4">Bandas que segue</h2>
        {followedBands.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Esse usuário ainda não segue nenhuma banda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {followedBands.map((band) => (
              <Link
                key={band.id}
                to={`/artista/${band.id}`}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-all text-center"
              >
                {band.avatar_url ? (
                  <img
                    src={band.avatar_url}
                    alt={band.username}
                    className="h-20 w-20 rounded-full object-cover border-2 border-transparent group-hover:border-primary transition-colors"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full gradient-rock flex items-center justify-center">
                    <span className="font-display text-2xl text-primary-foreground">
                      {band.username[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground truncate max-w-[120px]">{band.username}</p>
                  {band.genre && <p className="text-xs text-muted-foreground">{band.genre}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default UserProfile;
