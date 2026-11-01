import { Headphones, Music, LogIn, UserCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function DesktopAccountBar() {
  const { user } = useAuth();

  if (user) return null;

  return (
    <header className="fixed left-16 right-0 top-0 z-30 hidden h-[68px] items-center justify-end border-b border-border/80 bg-background/95 px-5 backdrop-blur-xl md:flex lg:left-60 lg:px-8">
      <div className="mr-auto hidden items-center gap-2 xl:flex">
        <span className="font-display text-lg tracking-wide text-foreground">FAÇA PARTE DA CENA</span>
        <span className="text-xs text-muted-foreground">Entre para descobrir ou divulgar novos sons.</span>
      </div>

      <nav aria-label="Acesso à conta" className="flex items-center gap-2">
        <Link
          to="/auth?mode=login&type=fan"
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary/60 hover:bg-primary/5 sm:px-4 sm:text-sm"
        >
          <Headphones className="h-4 w-4 text-primary" />
          Entrar como fã
        </Link>
        <Link
          to="/auth?mode=login&type=banda"
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary/60 hover:bg-primary/5 sm:px-4 sm:text-sm"
        >
          <Music className="h-4 w-4 text-primary" />
          Entrar como banda
        </Link>
        <Link
          to="/auth?mode=signup"
          className="inline-flex min-h-10 items-center gap-2 rounded-full gradient-rock px-3 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/15 transition-opacity hover:opacity-90 sm:px-4 sm:text-sm"
        >
          <LogIn className="h-4 w-4" />
          Criar conta
        </Link>
      </nav>
    </header>
  );
}
