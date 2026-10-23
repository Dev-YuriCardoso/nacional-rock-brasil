import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MessageCircle, ShoppingBag } from "lucide-react";
import { ChatRoom } from "./ChatRoom";

interface Room {
  id: string;
  participant_a: string;
  participant_b: string;
  product_id: string | null;
  created_at: string;
  other_username?: string;
  product_title?: string;
}

export const ChatList = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeOtherName, setActiveOtherName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadRooms();
  }, [user]);

  const loadRooms = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("chat_rooms")
      .select("*")
      .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      const otherIds = [...new Set(data.map((r) => r.participant_a === user.id ? r.participant_b : r.participant_a))];
      const productIds = data.map((r) => r.product_id).filter(Boolean) as string[];

      const [profilesRes, productsRes] = await Promise.all([
        supabase.from("profiles").select("id, username").in("id", otherIds),
        productIds.length > 0 ? supabase.from("products").select("id, title").in("id", productIds) : { data: [] },
      ]);

      const profileMap = new Map((profilesRes.data || []).map((p) => [p.id, p.username]));
      const productMap = new Map(((productsRes.data || []) as any[]).map((p) => [p.id, p.title]));

      setRooms(data.map((r) => ({
        ...r,
        other_username: profileMap.get(r.participant_a === user.id ? r.participant_b : r.participant_a) || "Usuário",
        product_title: r.product_id ? productMap.get(r.product_id) || undefined : undefined,
      })));
    } else {
      setRooms([]);
    }
    setLoading(false);
  };

  const openRoom = (room: Room) => {
    setActiveRoomId(room.id);
    setActiveOtherName(room.other_username || "Usuário");
  };

  if (!user) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg text-foreground">MENSAGENS</h3>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : rooms.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Nenhuma conversa ainda.</p>
      ) : (
        <div className="space-y-1">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => openRoom(room)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/40 transition-colors text-left"
            >
              <div className="h-9 w-9 rounded-full gradient-rock flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary-foreground">
                  {(room.other_username || "U")[0]?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{room.other_username}</p>
                {room.product_title && (
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <ShoppingBag className="h-3 w-3" />
                    {room.product_title}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {activeRoomId && (
        <ChatRoom
          roomId={activeRoomId}
          otherUsername={activeOtherName}
          onClose={() => setActiveRoomId(null)}
        />
      )}
    </div>
  );
};
