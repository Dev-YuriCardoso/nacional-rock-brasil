import { Headphones, Music, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function AccountAccessCard() {
  const { user } = useAuth();
  if (user) return null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-4 sm:p-5 md:p-6">
      <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3 w-3" /> Faça parte da cena
          </div>
          <h2 className="font-display text-2xl leading-none text-foreground sm:text-3xl">SUA PRÓXIMA DESCOBERTA COMEÇA AQUI</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            Siga artistas, encontre eventos da sua região ou coloque sua banda no mapa.
          </p>
        </div>
        <div className="grid w-full gap-2 sm:w-auto sm:min-w-[230px]">
          <Link to="/auth?mode=signup&type=fan" className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/60 hover:bg-primary/5">
            <span className="flex items-center gap-2"><Headphones className="h-4 w-4 text-primary" /> Criar conta de fã</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link to="/auth?mode=signup&type=banda" className="flex min-h-11 items-center justify-between gap-3 rounded-xl gradient-rock px-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            <span className="flex items-center gap-2"><Music className="h-4 w-4" /> Cadastrar minha banda</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <p className="relative mt-4 border-t border-border/70 pt-3 text-xs text-muted-foreground">
        Já tem uma conta?{" "}
        <Link to="/auth?mode=login&type=fan" className="font-semibold text-primary hover:underline">Entrar como fã</Link>
        <span className="px-1.5 text-border">·</span>
        <Link to="/auth?mode=login&type=banda" className="font-semibold text-primary hover:underline">Entrar como banda</Link>
      </p>
    </section>
  );
}
