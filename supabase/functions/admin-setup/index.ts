import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const textField = (value: unknown, maxLength: number) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Método não permitido" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Não autorizado. Entre novamente na conta administrativa." }, 401);
    }

    const token = authHeader.slice("Bearer ".length);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "A função de cadastro não está configurada corretamente no servidor." }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: callerData, error: callerError } = await supabaseAdmin.auth.getUser(token);
    if (callerError || !callerData?.user) {
      return json({ error: "Sessão inválida. Entre novamente na conta administrativa." }, 401);
    }

    const { data: adminRole, error: roleLookupError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleLookupError) {
      return json({ error: "Não foi possível verificar as permissões de administrador." }, 500);
    }
    if (!adminRole) {
      return json({ error: "Acesso negado: apenas administradores podem cadastrar bandas." }, 403);
    }

    const body = await req.json();
    const action = body?.action;
    const email = textField(body?.email, 255).toLowerCase();
    const password = typeof body?.password === "string" ? body.password : "";
    const username = textField(body?.username, 100);
    const genre = textField(body?.genre, 100);
    const estado = textField(body?.estado, 20);
    const bio = textField(body?.bio, 1000);
    const avatarUrl = textField(body?.avatar_url, 500);
    const requestedRole = body?.role;

    if (action !== "create-admin" && action !== "create-user") {
      return json({ error: "Ação desconhecida" }, 400);
    }
    if (!email || !password || !username) {
      return json({ error: "Preencha nome, e-mail e senha." }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Informe um endereço de e-mail válido." }, 400);
    }
    if (password.length < 8) {
      return json({ error: "A senha deve ter ao menos 8 caracteres." }, 400);
    }
    if (password.length > 128) {
      return json({ error: "A senha excede o limite permitido." }, 400);
    }
    if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) {
      return json({ error: "A URL do avatar deve começar com http:// ou https://." }, 400);
    }

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        user_type: "banda",
        accepted_terms: true,
        genre,
      },
    });

    if (createError || !created?.user) {
      const message = createError?.message || "O Supabase não retornou a conta criada.";
      return json({ error: message }, 400);
    }

    const userId = created.user.id;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        username,
        user_type: "banda",
        genre,
        estado,
        bio,
        avatar_url: avatarUrl,
      })
      .eq("id", userId);

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return json({ error: "A conta foi revertida porque não foi possível salvar o perfil da banda: " + profileError.message }, 500);
    }

    const safeRole = requestedRole === "admin" || requestedRole === "moderator" ? requestedRole : "user";
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: userId, role: safeRole },
        { onConflict: "user_id,role", ignoreDuplicates: true },
      );

    if (roleError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return json({ error: "A conta foi revertida porque não foi possível configurar as permissões: " + roleError.message }, 500);
    }

    return json({ success: true, user_id: userId });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Erro interno ao cadastrar a banda." }, 500);
  }
});
