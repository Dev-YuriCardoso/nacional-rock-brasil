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

async function deleteIds(admin: any, table: string, column: string, ids: string[]) {
  if (!ids.length) return;
  const { error } = await admin.from(table).delete().in(column, ids);
  if (error) throw new Error(`Não foi possível limpar ${table}.` + " " + error.message);
}

async function cleanupDemoData(admin: any) {
  const { data: profiles, error: profileLookupError } = await admin
    .from("profiles")
    .select("id")
    .eq("is_demo", true);
  if (profileLookupError) throw new Error("Não foi possível localizar os perfis de teste: " + profileLookupError.message);

  const ids = (profiles || []).map((profile: any) => profile.id as string);
  if (!ids.length) {
    return { bands_deleted: 0, classifieds_deleted: 0, products_deleted: 0 };
  }

  const [productsResult, postsResult, classifiedsResult] = await Promise.all([
    admin.from("products").select("id").in("owner_id", ids),
    admin.from("posts").select("id").in("artist_id", ids),
    admin.from("classifieds").select("id").in("user_id", ids),
  ]);
  if (productsResult.error) throw new Error("Não foi possível localizar os produtos de teste: " + productsResult.error.message);
  if (postsResult.error) throw new Error("Não foi possível localizar as publicações de teste: " + postsResult.error.message);
  if (classifiedsResult.error) throw new Error("Não foi possível localizar os classificados de teste: " + classifiedsResult.error.message);

  const productIds = (productsResult.data || []).map((row: any) => row.id as string);
  const postIds = (postsResult.data || []).map((row: any) => row.id as string);

  const roomQueries = await Promise.all([
    admin.from("chat_rooms").select("id").in("participant_a", ids),
    admin.from("chat_rooms").select("id").in("participant_b", ids),
    productIds.length
      ? admin.from("chat_rooms").select("id").in("product_id", productIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  for (const result of roomQueries) {
    if (result.error) throw new Error("Não foi possível localizar conversas relacionadas aos perfis de teste: " + result.error.message);
  }
  const roomIds = [...new Set(roomQueries.flatMap((result: any) => (result.data || []).map((row: any) => row.id as string)))];

  await deleteIds(admin, "messages", "sender_id", ids);
  await deleteIds(admin, "messages", "room_id", roomIds);
  await deleteIds(admin, "chat_rooms", "id", roomIds);
  await deleteIds(admin, "post_likes", "user_id", ids);
  await deleteIds(admin, "post_likes", "post_id", postIds);
  await deleteIds(admin, "comments", "artist_id", ids);
  await deleteIds(admin, "comments", "user_id", ids);
  await deleteIds(admin, "follows", "follower_id", ids);
  await deleteIds(admin, "follows", "following_id", ids);
  await deleteIds(admin, "classifies", "user_id", []);
  await deleteIds(admin, "classifIeds", "user_id", []);
  await deleteIds(admin, "classifieds", "user_id", ids);
  await deleteIds(admin, "payment_requests", "band_id", ids);
  await deleteIds(admin, "payment_requests", "reviewed_by", ids);
  await deleteIds(admin, "events", "artist_id", ids);
  await deleteIds(admin, "content", "artist_id", ids);
  await deleteIds(admin, "home_featured", "band_id", ids);
  await deleteIds(admin, "posts", "artist_id", ids);
  await deleteIds(admin, "products", "owner_id", ids);
  await deleteIds(admin, "user_roles", "user_id", ids);
  await deleteIds(admin, "profiles", "id", ids);

  for (const id of ids) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw new Error("Os dados relacionados foram limpos, mas não foi possível remover uma conta de teste: " + error.message);
  }

  return {
    bands_deleted: ids.length,
    classifieds_deleted: (classifiedsResult.data || []).length,
    products_deleted: productIds.length,
  };
}

const demoBands = [
  {
    slug: "mare-de-ruido",
    username: "Maré de Ruído (DEMO)",
    genre: "Punk",
    estado: "BA",
    bio: "Banda fictícia de punk rock de Salvador, Bahia. Perfil demonstrativo para testar páginas de artistas, catálogo e navegação. Não representa uma banda real.",
    avatar_url: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=85",
  },
  {
    slug: "aurora-de-concreto",
    username: "Aurora de Concreto (DEMO)",
    genre: "Alternative",
    estado: "SP",
    bio: "Projeto fictício de rock alternativo de São Paulo. Perfil demonstrativo para visualização de informações, imagens e identidade de bandas.",
    avatar_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=85",
  },
  {
    slug: "vertice-sombria",
    username: "Vértice Sombria (DEMO)",
    genre: "Goth",
    estado: "PE",
    bio: "Banda fictícia de sonoridade gótica de Recife, Pernambuco. Conta de teste, sem agenda ou lançamentos reais.",
    avatar_url: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=600&q=85",
  },
  {
    slug: "serra-eletrica",
    username: "Serra Elétrica (DEMO)",
    genre: "Hard Rock",
    estado: "MG",
    bio: "Banda fictícia de hard rock de Belo Horizonte, Minas Gerais. Criada exclusivamente para demonstrar os recursos da plataforma.",
    avatar_url: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=85",
  },
  {
    slug: "neon-carmim",
    username: "Neon Carmim (DEMO)",
    genre: "Emo",
    estado: "RJ",
    bio: "Projeto fictício de rock emo do Rio de Janeiro. Perfil de demonstração, não representa artista ou negócio real.",
    avatar_url: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&q=85",
  },
  {
    slug: "ultimo-acorde",
    username: "Último Acorde (DEMO)",
    genre: "Metal",
    estado: "PR",
    bio: "Banda fictícia de metal de Curitiba, Paraná. Perfil criado para testar a listagem e os detalhes de artistas.",
    avatar_url: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=600&q=85",
  },
];

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
      return json({ error: "A função administrativa não está configurada corretamente no servidor." }, 500);
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
      return json({ error: "Acesso negado: somente administradores podem executar esta ação." }, 403);
    }

    const body = await req.json();
    const action = body?.action;

    if (action === "delete-demo") {
      const result = await cleanupDemoData(supabaseAdmin);
      return json({ success: true, ...result });
    }

    if (action === "seed-demo") {
      await cleanupDemoData(supabaseAdmin);
      const createdIds: string[] = [];
      try {
        for (const band of demoBands) {
          const email = `demo-${band.slug}@example.com`;
          const password = `Demo!${crypto.randomUUID()}Aa9`;
          const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              username: band.username,
              user_type: "banda",
              accepted_terms: true,
              genre: band.genre,
            },
          });

          if (createError || !created?.user) {
            throw new Error("Não foi possível criar o perfil " + band.username + ": " + (createError?.message || "conta não retornada"));
          }

          const userId = created.user.id;
          createdIds.push(userId);

          const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .update({
              username: band.username,
              user_type: "banda",
              genre: band.genre,
              estado: band.estado,
              bio: band.bio,
              avatar_url: band.avatar_url,
              is_demo: true,
              accepted_terms: true,
              terms_accepted_at: new Date().toISOString(),
            })
            .eq("id", userId)
            .select("id")
            .maybeSingle();

          if (profileError || !profile) {
            throw new Error("Não foi possível salvar o perfil " + band.username + ": " + (profileError?.message || "perfil não encontrado"));
          }
        }

        const products = [
          { owner_id: createdIds[0], title: "Pedal de Distorção (DEMO)", description: "Pedal fictício para demonstrar a vitrine da loja. Produto sem oferta ou venda real.", price: 349.90, category: "Pedais e efeitos", image_url: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=85" },
          { owner_id: createdIds[1], title: "Guitarra Elétrica (DEMO)", description: "Instrumento demonstrativo para visualização de cards e detalhes de produto. Não está à venda.", price: 1499.00, category: "Instrumentos", image_url: "https://images.unsplash.com/photo-1550291652-6ea9114a47b1?auto=format&fit=crop&w=800&q=85" },
          { owner_id: createdIds[2], title: "Amplificador 20W (DEMO)", description: "Amplificador fictício criado exclusivamente para testar o marketplace.", price: 579.90, category: "Amplificadores", image_url: "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?auto=format&fit=crop&w=800&q=85" },
          { owner_id: createdIds[3], title: "Microfone Dinâmico (DEMO)", description: "Item fictício para demonstração. Não representa uma oferta comercial real.", price: 289.90, category: "Áudio", image_url: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=85" },
          { owner_id: createdIds[4], title: "Baixo 4 Cordas (DEMO)", description: "Baixo demonstrativo para testar filtros e apresentação de produtos.", price: 1699.00, category: "Instrumentos", image_url: "https://images.unsplash.com/photo-1520166012956-add9ba0835cb?auto=format&fit=crop&w=800&q=85" },
          { owner_id: createdIds[5], title: "Fone de Estúdio (DEMO)", description: "Acessório fictício para visualização da loja. Não está à venda.", price: 399.90, category: "Acessórios", image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=85" },
        ];

        const classifieds = [
          { user_id: createdIds[0], category: "Músicos", estado: "BA", title: "Procura-se baterista para projeto autoral [TESTE]", description: "Anúncio fictício para testar a área de classificados. Buscamos baterista para projeto de punk rock. Não responda: este anúncio não é real.", contact: "Contato demonstrativo — não responder" },
          { user_id: createdIds[1], category: "Instrumentos", estado: "SP", title: "Guitarra usada em ótimo estado [TESTE]", description: "Anúncio fictício de instrumento para testar cards, detalhes e filtros dos classificados. Nenhuma venda real.", contact: "Contato demonstrativo — não responder" },
          { user_id: createdIds[2], category: "Espaços", estado: "PE", title: "Estúdio para ensaio por hora [TESTE]", description: "Espaço fictício criado para demonstração da área de classificados. Não existe reserva real.", contact: "Contato demonstrativo — não responder" },
          { user_id: createdIds[3], category: "Músicos", estado: "MG", title: "Vocalista procura banda de hard rock [TESTE]", description: "Anúncio de exemplo, sem pessoa ou contato real. Criado apenas para visualizar a listagem.", contact: "Contato demonstrativo — não responder" },
          { user_id: createdIds[4], category: "Serviços", estado: "RJ", title: "Aulas de guitarra para iniciantes [TESTE]", description: "Serviço fictício para testar a apresentação de classificados. Não representa oferta real.", contact: "Contato demonstrativo — não responder" },
          { user_id: createdIds[5], category: "Instrumentos", estado: "PR", title: "Kit de cabos para palco [TESTE]", description: "Anúncio fictício, sem produto ou negociação real.", contact: "Contato demonstrativo — não responder" },
        ];

        const [productsResult, classifiedsResult] = await Promise.all([
          supabaseAdmin.from("products").insert(products),
          supabaseAdmin.from("classifieds").insert(classifieds),
        ]);
        if (productsResult.error) throw new Error("Não foi possível criar os produtos demonstrativos: " + productsResult.error.message);
        if (classifiedsResult.error) throw new Error("Não foi possível criar os classificados demonstrativos: " + classifiedsResult.error.message);

        return json({
          success: true,
          bands_created: createdIds.length,
          products_created: products.length,
          classifieds_created: classifieds.length,
          message: "Dados demonstrativos criados. Todos os itens estão identificados como DEMO ou TESTE.",
        });
      } catch (seedError) {
        try {
          await cleanupDemoData(supabaseAdmin);
        } catch (cleanupError) {
          console.error("Falha ao reverter criação demonstrativa:", cleanupError);
        }
        for (const id of createdIds) {
          await supabaseAdmin.auth.admin.deleteUser(id);
        }
        throw seedError;
      }
    }

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
    return json({ error: err instanceof Error ? err.message : "Erro interno ao executar a ação administrativa." }, 500);
  }
});
