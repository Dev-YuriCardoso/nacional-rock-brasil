// Edge Function: resolve-bandcamp
// Recebe um link do Bandcamp e devolve a URL do player embutido (embed).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Aceita somente https://<algo>.bandcamp.com (evita usar a função para acessar outros sites)
function isBandcampUrl(value: string): URL | null {
  try {
    const u = new URL(value);
    const host = u.hostname.toLowerCase();
    if (u.protocol !== "https:") return null;
    if (host === "bandcamp.com" || host.endsWith(".bandcamp.com")) return u;
    return null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    const parsed = typeof url === "string" ? isBandcampUrl(url) : null;
    if (!parsed) {
      return json({ error: "URL do Bandcamp inválida" }, 400);
    }

    const response = await fetch(parsed.toString(), {
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
    });
    // Se redirecionou para fora do Bandcamp, recusa
    if (!isBandcampUrl(response.url)) {
      return json({ error: "URL do Bandcamp inválida" }, 400);
    }
    const html = await response.text();

    let itemId: string | null = null;
    let itemType: "track" | "album" = "track";

    // 1) meta og:video
    const ogVideoMatch = html.match(/property="og:video"[^>]*content="[^"]*?(track|album)=(\d+)/);
    if (ogVideoMatch) {
      itemType = ogVideoMatch[1] as "track" | "album";
      itemId = ogVideoMatch[2];
    }

    // 2) data-tralbum-id
    if (!itemId) {
      const tralbumMatch = html.match(/data-tralbum-id="(\d+)"/);
      if (tralbumMatch) {
        itemId = tralbumMatch[1];
        itemType = parsed.pathname.includes("/album/") ? "album" : "track";
      }
    }

    // 3) "current":{"id":123
    if (!itemId) {
      const currentMatch = html.match(/"current"\s*:\s*\{[^}]*"id"\s*:\s*(\d+)/);
      if (currentMatch) {
        itemId = currentMatch[1];
        itemType = parsed.pathname.includes("/album/") ? "album" : "track";
      }
    }

    if (!itemId) {
      return json({ error: "Não foi possível extrair o ID do Bandcamp" }, 404);
    }

    const embedUrl = `https://bandcamp.com/EmbeddedPlayer/${itemType}=${itemId}/size=large/bgcol=333333/linkcol=e99708/tracklist=false/artwork=small/transparent=true/`;
    return json({ embedUrl, itemId, itemType });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro interno" }, 500);
  }
});
