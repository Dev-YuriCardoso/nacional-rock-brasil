import { useEffect, useState } from "react";
import {
  Home, Users, Calendar, ShoppingBag, Newspaper, Guitar, LogIn, LogOut,
  LayoutDashboard, Shield, UserCircle, Search, Megaphone, Headphones, Music,
  X, ChevronUp, ArrowRight,
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { title: "Início", url: "/", icon: Home },
  { title: "Artistas", url: "/artistas", icon: Users },
  { title: "Eventos", url: "/eventos", icon: Calendar },
  { title: "Buscar", url: "/buscar", icon: Search },
  { title: "Classificados", url: "/classificados", icon: Megaphone },
  { title: "Loja", url: "/loja", icon: ShoppingBag },
  { title: "News", url: "/news", icon: Newspaper },
];

const accountLinks = [
  { title: "Entrar como fã", url: "/auth?mode=login&type=fan", icon: Headphones, description: "Descubra e siga bandas" },
  { title: "Entrar como banda", url: "/auth?mode=login&type=banda", icon: Music, description: "Gerencie seu projeto musical" },
];

const createLinks = [
  { title: "Criar conta de fã", url: "/auth?mode=signup&type=fan", icon: Headphones },
  { title: "Cadastrar uma banda", url: "/auth?mode=signup&type=banda", icon: Music },
];

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const isMobile = useIsMobile();
  const location = useLocation();
  const [accountOpen, setAccountOpen] = useState(false);
  const isBand = user?.user_metadata?.user_type === "banda";
  const displayName = user?.user_metadata?.username || user?.email?.split("@")[0] || "Minha conta";

  useEffect(() => {
    setAccountOpen(false);
  }, [location.pathname, location.search]);

  const accountPanel = (
    <div className="space-y-2">
      {user ? (
        <>
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-rock text-sm font-bold text-primary-foreground">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                <p className="text-[11px] text-muted-foreground">{isBand ? "Conta de banda" : "Conta de fã"}</p>
              </div>
            </div>
          </div>
          <Link to="/perfil" className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-sidebar-foreground hover:bg-sidebar-accent">
            <UserCircle className="h-4 w-4" /> Meu perfil
          </Link>
          {isBand && (
            <Link to="/dashboard" className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-sidebar-foreground hover:bg-sidebar-accent">
              <LayoutDashboard className="h-4 w-4" /> Painel da banda
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-sidebar-foreground hover:bg-sidebar-accent">
              <Shield className="h-4 w-4" /> Administração
            </Link>
          )}
          <button
            onClick={() => signOut()}
            className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Sair da conta
          </button>
        </>
      ) : (
        <>
          <div className="px-1 pb-1">
            <p className="font-display text-lg text-foreground">FAÇA PARTE DA CENA</p>
            <p className="text-xs leading-relaxed text-muted-foreground">Entre para acompanhar bandas ou divulgar seu som.</p>
          </div>
          {accountLinks.map((item) => (
            <Link key={item.url} to={item.url} className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-card px-3 transition-colors hover:border-primary/60 hover:bg-primary/5">
              <item.icon className="h-5 w-5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{item.title}</span>
                <span className="block text-[11px] text-muted-foreground">{item.description}</span>
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
          <div className="border-t border-border pt-2">
            <p className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ainda não tem conta?</p>
            {createLinks.map((item) => (
              <Link key={item.url} to={item.url} className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-semibold text-primary hover:bg-primary/10">
                <item.icon className="h-4 w-4" /> {item.title}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );

  if (isMobile) {
    const mobileItems = [
      { title: "Início", url: "/", icon: Home },
      { title: "Bandas", url: "/artistas", icon: Users },
      { title: "Buscar", url: "/buscar", icon: Search },
      { title: "Eventos", url: "/eventos", icon: Calendar },
      { title: "Loja", url: "/loja", icon: ShoppingBag },
    ];

    return (
      <>
        <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-border/80 bg-background/95 px-4 backdrop-blur-xl">
          <Link to="/" className="flex items-center gap-2" aria-label="Nacional Rock Brasil - início">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Guitar className="h-5 w-5 text-primary" />
            </div>
            <span className="font-display text-xl tracking-wide text-foreground">ROCK BR</span>
          </Link>
          <button
            onClick={() => setAccountOpen((open) => !open)}
            aria-expanded={accountOpen}
            aria-label={user ? "Abrir menu da conta" : "Entrar ou criar conta"}
            className={cn(
              "flex min-h-10 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors",
              accountOpen ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground"
            )}
          >
            {user ? (
              <span className="flex h-6 w-6 items-center justify-center rounded-full gradient-rock text-[10px] font-bold text-primary-foreground">
                {displayName.slice(0, 1).toUpperCase()}
              </span>
            ) : (
              <UserCircle className="h-4 w-4 text-primary" />
            )}
            {user ? "Minha conta" : "Entrar"}
            {accountOpen ? <X className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5 rotate-180" />}
          </button>
        </header>

        {accountOpen && (
          <>
            <button aria-label="Fechar menu da conta" className="fixed inset-0 z-[51] bg-black/50" onClick={() => setAccountOpen(false)} />
            <div className="fixed left-3 right-3 top-[72px] z-[52] max-h-[calc(100svh-150px)] overflow-y-auto rounded-2xl border border-border bg-sidebar p-4 shadow-2xl">
              {accountPanel}
            </div>
          </>
        )}

        <nav aria-label="Navegação principal" className="safe-area-bottom fixed inset-x-0 bottom-0 z-50 border-t border-border bg-sidebar/95 px-1 pt-1.5 pb-1 backdrop-blur-xl">
          <div className="mx-auto grid max-w-lg grid-cols-5">
            {mobileItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === "/"}
                className={({ isActive }) => cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </>
    );
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-16 flex-col border-r border-border bg-sidebar px-2 py-5 lg:w-60 lg:px-3">
      <Link to="/" className="mb-7 flex items-center justify-center gap-2 px-1 lg:justify-start lg:px-3">
        <Guitar className="h-8 w-8 shrink-0 text-primary" />
        <span className="hidden font-display text-xl tracking-wider text-foreground lg:block">ROCK BR</span>
      </Link>

      <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/"}
            title={item.title}
            className={({ isActive }) => cn(
              "flex min-h-11 items-center justify-center gap-3 rounded-xl px-2 text-sm font-medium transition-colors lg:justify-start lg:px-3",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              isActive ? "bg-sidebar-accent text-primary" : "text-sidebar-foreground"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span className="hidden lg:block">{item.title}</span>
          </NavLink>
        ))}

        {user && (
          <>
            <div className="my-3 border-t border-border" />
            <Link to="/perfil" title="Meu perfil" className="flex min-h-11 items-center justify-center gap-3 rounded-xl px-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent lg:justify-start lg:px-3">
              <UserCircle className="h-5 w-5 shrink-0" />
              <span className="hidden lg:block">Meu perfil</span>
            </Link>
            {isBand && (
              <Link to="/dashboard" title="Painel da banda" className="flex min-h-11 items-center justify-center gap-3 rounded-xl px-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent lg:justify-start lg:px-3">
                <LayoutDashboard className="h-5 w-5 shrink-0" />
                <span className="hidden lg:block">Painel da banda</span>
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" title="Administração" className="flex min-h-11 items-center justify-center gap-3 rounded-xl px-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent lg:justify-start lg:px-3">
                <Shield className="h-5 w-5 shrink-0" />
                <span className="hidden lg:block">Administração</span>
              </Link>
            )}
          </>
        )}
      </nav>

      <div className="mt-4 border-t border-border pt-4">
        {user ? (
          <div className="space-y-2">
            <div className="hidden rounded-xl bg-card p-3 lg:block">
              <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
              <p className="text-[11px] text-muted-foreground">{isBand ? "Conta de banda" : "Conta de fã"}</p>
            </div>
            <button onClick={() => signOut()} title="Sair" className="flex min-h-11 w-full items-center justify-center gap-3 rounded-xl px-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-destructive lg:justify-start lg:px-3">
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="hidden lg:block">Sair da conta</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="hidden px-2 font-display text-lg text-foreground lg:block">ENTRE NA CENA</p>
            <Link to="/auth?mode=login&type=fan" title="Entrar como fã" className="flex min-h-11 items-center justify-center gap-3 rounded-xl border border-border bg-card px-2 text-sm font-semibold text-foreground hover:border-primary/60 lg:justify-start lg:px-3">
              <Headphones className="h-5 w-5 shrink-0 text-primary" />
              <span className="hidden lg:block">Entrar como fã</span>
            </Link>
            <Link to="/auth?mode=login&type=banda" title="Entrar como banda" className="flex min-h-11 items-center justify-center gap-3 rounded-xl border border-border bg-card px-2 text-sm font-semibold text-foreground hover:border-primary/60 lg:justify-start lg:px-3">
              <Music className="h-5 w-5 shrink-0 text-primary" />
              <span className="hidden lg:block">Entrar como banda</span>
            </Link>
            <Link to="/auth?mode=signup" title="Criar conta" className="flex min-h-11 items-center justify-center gap-2 rounded-xl gradient-rock px-2 text-sm font-semibold text-primary-foreground lg:px-3">
              <LogIn className="h-4 w-4 shrink-0" />
              <span className="hidden lg:block">Criar conta grátis</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
