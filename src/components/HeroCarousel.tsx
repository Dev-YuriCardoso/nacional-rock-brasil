import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  const [slides, setSlides] = useState<Slide[]>([
    {
      image: heroConcert,
      title: "ROCK NACIONAL EM ALTA",
      subtitle: "Descubra os melhores artistas do cenário brasileiro",
      cta: "Explorar",
      link: "/artistas",
    },
  ]);

  useEffect(() => {
    loadSlides();
  }, []);

  const loadSlides = async () => {
    // Load custom banner from site_settings
    const { data: bannerSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "home_banner_url")
      .maybeSingle();

    // Load featured bands
    const { data: featured } = await supabase
      .from("home_featured")
      .select("band_id, display_order, profiles(id, username, genre, banner_url, avatar_url)")
      .order("display_order", { ascending: true })
      .limit(5);

    const builtSlides: Slide[] = [];

    // Main banner slide
    builtSlides.push({
      image: bannerSetting?.value || heroConcert,
      title: "ROCK NACIONAL EM ALTA",
      subtitle: "Descubra os melhores artistas do cenário brasileiro",
      cta: "Explorar",
      link: "/artistas",
    });

    // Featured band slides
    if (featured) {
      for (const item of featured) {
        const profile = item.profiles as any;
        if (profile) {
          builtSlides.push({
            image: profile.banner_url || profile.avatar_url || heroConcert,
            title: profile.username?.toUpperCase() || "DESTAQUE",
            subtitle: profile.genre || "Rock Nacional",
            cta: "Ver Perfil",
            link: `/artista/${profile.id}`,
          });
        }
      }
    }

    setSlides(builtSlides);
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent((c) => (c + 1) % slides.length);

  return (
    <div className="relative h-[50vh] min-h-[360px] overflow-hidden rounded-xl">
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
        >
          <img src={slide.image} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute bottom-12 left-8 right-8 animate-slide-up">
            <h2 className="font-display text-4xl md:text-6xl text-foreground mb-2">
              {slide.title}
            </h2>
            <p className="text-muted-foreground text-lg mb-4">{slide.subtitle}</p>
            <Link
              to={slide.link}
              className="inline-block gradient-rock px-6 py-2.5 rounded-full font-semibold text-primary-foreground text-sm hover:opacity-90 transition-opacity glow-red"
            >
              {slide.cta}
            </Link>
          </div>
        </div>
      ))}
      {slides.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/50 flex items-center justify-center text-foreground hover:bg-background/80 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/50 flex items-center justify-center text-foreground hover:bg-background/80 transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === current ? "w-8 bg-primary" : "w-4 bg-muted-foreground/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
