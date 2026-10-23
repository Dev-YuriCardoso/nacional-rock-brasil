import { useState, useEffect } from "react";
import { Award, Star, Flame, Users, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Badge {
  id: string;
  icon: React.ReactNode;
  name: string;
  description: string;
  earned: boolean;
}

interface UserBadgesProps {
  userId: string;
}

export function UserBadges({ userId }: UserBadgesProps) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    computeBadges();
  }, [userId]);

  const computeBadges = async () => {
    // Get follows count
    const { count: followsCount } = await supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", userId);

    // Get comments count
    const { count: commentsCount } = await supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    // Get post likes count
    const { count: likesCount } = await supabase
      .from("post_likes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    // Check if user follows a band created in the last 30 days (Pioneer)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data: followedIds } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);

    let isPioneer = false;
    if (followedIds && followedIds.length > 0) {
      const { count: newBands } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .in("id", followedIds.map(f => f.following_id))
        .gte("created_at", thirtyDaysAgo);
      isPioneer = (newBands || 0) > 0;
    }

    const computed: Badge[] = [
      {
        id: "pioneer",
        icon: <Star className="h-5 w-5" />,
        name: "Fã Pioneiro",
        description: "Segue uma banda que se cadastrou nos últimos 30 dias",
        earned: isPioneer,
      },
      {
        id: "social",
        icon: <Users className="h-5 w-5" />,
        name: "Sociável",
        description: "Segue 3 ou mais bandas",
        earned: (followsCount || 0) >= 3,
      },
      {
        id: "commentator",
        icon: <Flame className="h-5 w-5" />,
        name: "Comentarista",
        description: "Fez 5 ou mais comentários",
        earned: (commentsCount || 0) >= 5,
      },
      {
        id: "supporter",
        icon: <Music className="h-5 w-5" />,
        name: "Apoiador",
        description: "Curtiu 10 ou mais posts",
        earned: (likesCount || 0) >= 10,
      },
      {
        id: "devotee",
        icon: <Award className="h-5 w-5" />,
        name: "Devoto do Rock",
        description: "Segue 10 ou mais bandas",
        earned: (followsCount || 0) >= 10,
      },
    ];

    setBadges(computed);
    setLoading(false);
  };

  if (loading) return null;

  const earned = badges.filter((b) => b.earned);
  const unearned = badges.filter((b) => !b.earned);

  return (
    <div className="space-y-4">
      <h3 className="font-display text-xl text-foreground flex items-center gap-2">
        <Award className="h-5 w-5 text-primary" />
        Conquistas
      </h3>
      {earned.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma conquista desbloqueada ainda.</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {earned.map((badge) => (
          <div key={badge.id} className="rounded-xl border border-primary/30 bg-card p-3 text-center">
            <div className="mx-auto h-10 w-10 rounded-full gradient-rock flex items-center justify-center text-primary-foreground mb-2">
              {badge.icon}
            </div>
            <p className="text-sm font-semibold text-foreground">{badge.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
          </div>
        ))}
        {unearned.map((badge) => (
          <div key={badge.id} className="rounded-xl border border-border bg-card/50 p-3 text-center opacity-40">
            <div className="mx-auto h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-2">
              {badge.icon}
            </div>
            <p className="text-sm font-semibold text-foreground">{badge.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
