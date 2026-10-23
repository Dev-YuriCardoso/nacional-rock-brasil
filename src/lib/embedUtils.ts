/**
 * Converts a Spotify track/album/playlist URL to an embed URL
 */
export function toSpotifyEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("spotify.com")) return null;
    if (u.pathname.startsWith("/embed/")) return url;
    const cleanPath = u.pathname.replace(/\/intl-[a-z]{2}\//, "/");
    return `https://open.spotify.com/embed${cleanPath}?utm_source=generator&theme=0`;
  } catch {
    return null;
  }
}

/**
 * Converts a YouTube URL to an embed URL
 */
export function toYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    let videoId: string | null = null;

    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return url;
      videoId = u.searchParams.get("v");
      if (!videoId && u.pathname.startsWith("/shorts/")) {
        videoId = u.pathname.split("/shorts/")[1];
      }
    } else if (u.hostname === "youtu.be") {
      videoId = u.pathname.slice(1);
    }

    if (!videoId) return null;
    return `https://www.youtube.com/embed/${videoId}`;
  } catch {
    return null;
  }
}

/**
 * Converts a SoundCloud URL to an embed URL
 * Uses the SoundCloud widget player with the original URL
 */
export function toSoundCloudEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("soundcloud.com")) return null;
    // Must have at least /user/track path
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
  } catch {
    return null;
  }
}

/**
 * Converts a Bandcamp URL to an embed-ready format
 * Since Bandcamp embeds require a numeric ID, we store the URL and resolve it via edge function
 * For detection purposes, we just validate the URL format
 */
export function toBandcampEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("bandcamp.com")) return null;
    // Valid Bandcamp track/album URL: xxx.bandcamp.com/track/yyy or /album/yyy
    if (!u.pathname.startsWith("/track/") && !u.pathname.startsWith("/album/")) return null;
    // Return a placeholder; the actual embed URL needs server-side resolution
    return url;
  } catch {
    return null;
  }
}

export type EmbedType = "spotify" | "youtube" | "soundcloud" | "bandcamp";

/**
 * Detects link type and returns embed URL
 */
export function toEmbed(url: string): { type: EmbedType; embedUrl: string } | null {
  const spotify = toSpotifyEmbed(url);
  if (spotify) return { type: "spotify", embedUrl: spotify };

  const youtube = toYouTubeEmbed(url);
  if (youtube) return { type: "youtube", embedUrl: youtube };

  const soundcloud = toSoundCloudEmbed(url);
  if (soundcloud) return { type: "soundcloud", embedUrl: soundcloud };

  const bandcamp = toBandcampEmbed(url);
  if (bandcamp) return { type: "bandcamp", embedUrl: bandcamp };

  return null;
}

/**
 * Maps embed type to content_type enum value
 */
export function embedTypeToContentType(type: EmbedType): string {
  const map: Record<EmbedType, string> = {
    spotify: "spotify_link",
    youtube: "youtube_link",
    soundcloud: "soundcloud_link",
    bandcamp: "bandcamp_link",
  };
  return map[type];
}
