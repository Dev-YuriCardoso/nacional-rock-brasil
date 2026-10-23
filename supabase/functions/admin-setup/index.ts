// Edge Function: admin-setup
// Cria contas (bandas ou administradores) a pedido de um ADMINISTRADOR logado.
// Usa a service role no servidor — a chave nunca vai para o navegador.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Identifica quem está chamando
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Não autorizado" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      return json({ error: "Não autorizado" }, 401);
    }
    const callerId = userData.user.id;

    // 2. Só administradores podem continuar
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return json({ error: "Acesso negado: requer papel de administrador" }, 403);
    }

    // 3. Ação solicitada
    const { action, email, password, username, role } = await req.json();

    // "create-admin" mantido por compatibilidade com o painel (também cria bandas)
    if (action === "create-admin" || action === "create-user") {
      if (!email || !password || !username) {
        return json({ error: "Campos obrigatórios ausentes" }, 400);
      }
      if (String(username).length > 100 || String(email).length > 255 || String(password).length > 128) {
        return json({ error: "Dados muito longos" }, 400);
      }
      if (String(password).length < 8) {
        return json({ error: "A senha deve ter ao menos 8 caracteres" }, 400);
      }

      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username, user_type: "banda", accepted_terms: true },
      });
      if (createError) {
        return json({ error: createError.message }, 400);
      }

      // O trigger handle_new_user já criou o perfil e o papel "user".
      // Só acrescentamos um papel extra se for pedido (ignora duplicado).
      const safeRole = role === "admin" || role === "moderator" ? role : "user";
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert(
          { user_id: created.user.id, role: safeRole },
          { onConflict: "user_id,role", ignoreDuplicates: true },
        );
      if (roleError) {
        return json({ error: roleError.message }, 400);
      }

      return json({ success: true, user_id: created.user.id });
    }

    return json({ error: "Ação desconhecida" }, 400);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Erro interno" }, 500);
  }
});
