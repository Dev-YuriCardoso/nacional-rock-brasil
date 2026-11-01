import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useGeo } from "@/contexts/GeoContext";
import heroConcert from "@/assets/hero-concert.jpg";

interface Slide {
  image: string;
  title: string;
  subtitle: string;
  cta: string;
  link: string;
}

export function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const { detectedState } = useGeo();
  const [slides, setSlides] = useState<Slide[]>([
    {
      image: heroConcert,
      title: "ROCK NACIONAL EM ALTA",
      subtitle: "Descubra bandas independentes e novos sons do Brasil.",
      cta: "Explorar artistas",
      link: "/artistas",
    },
  ]);

  useEffect(() => {
    let cancelled = false;
    const loadSlides = async () => {
      const [bannerResult, featuredResult] = await Promise.all([
        supabase.from("site_settings").select("value").eq("key", "home_banner_url").maybeSingle(),
        supabase.from("home_featured")
          .select("band_id, display_order, profiles(id, username, genre, banner_url, avatar_url)")
          .order("display_order", { ascending: true })
          .limit(5),
      ]);

      if (cancelled) return;
      const builtSlides: Slide[] = [{
        image: bannerResult.data?.value || heroConcert,
        title: "ROCK NACIONAL EM ALTA",
        subtitle: detectedState
          ? "Descubra artistas e sons que movimentam " + detectedState + "."
          : "Descubra bandas independentes e novos sons do Brasil.",
        cta: "Explorar artistas",
        link: "/artistas",
      }];

      for (const item of featuredResult.data || []) {
        const profile = item.profiles as any;
        if (!profile) continue;
        builtSlides.push({
          image: profile.banner_url || profile.avatar_url || heroConcert,
          title: profile.username?.toUpperCase() || "DESTAQUE",
          subtitle: profile.genre || "Rock independente brasileiro",
          cta: "Conhecer banda",
          link: "/artista/" + profile.id,
        });
      }
      setSlides(builtSlides);
    };

    loadSlides();
    return () => { cancelled = true; };
  }, [detectedState]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => setCurrent((value) => (value + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const prev = () => setCurrent((value) => (value - 1 + slides.length) % slides.length);
  const next = () => setCurrent((value) => (value + 1) % slides.length);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };
  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const startX = touchStartX.current;
    if (startX === null) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const distance = touch.clientX - startX;
    if (Math.abs(distance) > 45) distance > 0 ? prev() : next();
    touchStartX.current = null;
  };

  return (
    <section
      aria-label="Destaques do rock brasileiro"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="hidden relative h-[min(54svh,440px)] min-h-[300px] overflow-hidden rounded-2xl border border-border bg-card sm:block md:h-[460px] md:min-h-0"
    >
      {slides.map((item, index) => (
        <div key={item.link + index} className={`absolute inset-0 transition-opacity duration-700 ${index === current ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          <img src={item.image} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-background/5" />
          <div className="absolute inset-x-4 bottom-10 max-w-2xl sm:inset-x-7 sm:bottom-12 md:inset-x-10 md:bottom-14">
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary sm:text-xs">
              <MapPin className="h-3.5 w-3.5" /> {detectedState ? "CENA LOCAL · " + detectedState : "CENA INDEPENDENTE"}
            </p>
            <h1 className="font-display text-3xl leading-[0.95] tracking-wide text-foreground sm:text-4xl md:text-6xl">{item.title}</h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-foreground/75 sm:text-base md:text-lg">{item.subtitle}</p>
            <Link to={item.link} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full gradient-rock px-5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02]">
              {item.cta} <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <button aria-label="Destaque anterior" onClick={prev} className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur sm:flex">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button aria-label="Próximo destaque" onClick={next} className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur sm:flex">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 sm:right-7">
            {slides.map((item, index) => (
              <button
                key={item.link + index}
                aria-label={"Ir para destaque " + (index + 1)}
                aria-current={index === current}
                onClick={() => setCurrent(index)}
                className={`h-1.5 rounded-full transition-all ${index === current ? "w-7 bg-primary" : "w-2 bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
