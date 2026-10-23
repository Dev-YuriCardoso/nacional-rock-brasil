import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useChatRoom() {
  const { user } = useAuth();
  const { toast } = useToast();

  /** 
   * Opens or creates a chat room for a product negotiation.
   * Returns roomId if allowed, null if blocked.
   * Rule: user must be interested in a product OR follow the band.
   */
  const openOrCreateRoom = async (
    bandId: string,
    productId: string
  ): Promise<{ roomId: string; bandUsername: string } | null> => {
    if (!user) {
      toast({ title: "Faça login para enviar mensagens", variant: "destructive" });
      return null;
    }

    if (user.id === bandId) {
      toast({ title: "Você não pode iniciar um chat consigo mesmo." });
      return null;
    }

    // Get band username
    const { data: bandProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", bandId)
      .single();

    // Check existing room for this product
    const { data: existingRoom } = await supabase
      .from("chat_rooms")
      .select("id")
      .or(
        `and(participant_a.eq.${user.id},participant_b.eq.${bandId},product_id.eq.${productId}),and(participant_a.eq.${bandId},participant_b.eq.${user.id},product_id.eq.${productId})`
      )
      .maybeSingle();

    if (existingRoom) {
      return { roomId: existingRoom.id, bandUsername: bandProfile?.username || "Banda" };
    }

    // Create new room
    const { data: newRoom, error } = await supabase
      .from("chat_rooms")
      .insert({
        participant_a: user.id,
        participant_b: bandId,
        product_id: productId,
      })
      .select("id")
      .single();

    if (error) {
      toast({ title: "Erro ao criar conversa", description: error.message, variant: "destructive" });
      return null;
    }

    return { roomId: newRoom.id, bandUsername: bandProfile?.username || "Banda" };
  };

  return { openOrCreateRoom };
}
