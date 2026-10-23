import { Home, Users, Calendar, ShoppingBag, Newspaper, Guitar, LogIn, LogOut, LayoutDashboard, Shield, UserCircle, Search, Megaphone } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Artistas", url: "/artistas", icon: Users },
  { title: "Eventos", url: "/eventos", icon: Calendar },
  { title: "Buscar", url: "/buscar", icon: Search },
  { title: "Classificados", url: "/classificados", icon: Megaphone },
  { title: "Loja", url: "/loja", icon: ShoppingBag },
  { title: "News", url: "/news", icon: Newspaper },
];

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const isBand = user?.user_metadata?.user_type === "banda";

  // --- MOBILE: bottom navigation bar ---
  if (isMobile) {
    const mobileItems = [
      { title: "Home", url: "/", icon: Home },
      { title: "Artistas", url: "/artistas", icon: Users },
      { title: "Loja", url: "/loja", icon: ShoppingBag },
      { title: "Eventos", url: "/eventos", icon: Calendar },
      user
        ? { title: "Perfil", url: "/perfil", icon: UserCircle }
        : { title: "Entrar", url: "/auth", icon: LogIn },
    ];

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-sidebar px-1 py-1.5 safe-area-bottom">
        {mobileItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors min-w-0",
                isActive ? "text-primary" : "text-sidebar-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="truncate">{item.title}</span>
          </NavLink>
        ))}
      </nav>
    );
  }

  // --- DESKTOP: sidebar ---
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-16 flex-col items-center border-r border-border bg-sidebar py-6 lg:w-56">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2 px-3">
        <Guitar className="h-8 w-8 text-primary" />
        <span className="hidden font-display text-xl tracking-wider text-foreground lg:block">
          ROCK BR
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 w-full px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span className="hidden lg:block">{item.title}</span>
          </NavLink>
        ))}

        {/* Meu Perfil for logged-in users */}
        {user && (
          <NavLink
            to="/perfil"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground"
              )
            }
          >
            <UserCircle className="h-5 w-5 flex-shrink-0" />
            <span className="hidden lg:block">Meu Perfil</span>
          </NavLink>
        )}

        {/* Dashboard link for bands */}
        {isBand && (
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground"
              )
            }
          >
            <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
            <span className="hidden lg:block">Dashboard</span>
          </NavLink>
        )}

        {/* Admin link */}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground"
              )
            }
          >
            <Shield className="h-5 w-5 flex-shrink-0" />
            <span className="hidden lg:block">Admin</span>
          </NavLink>
        )}
      </nav>

      {/* Auth Button */}
      <div className="w-full px-2">
        {user ? (
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="hidden lg:block">Sair</span>
          </button>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-primary hover:bg-sidebar-accent transition-colors"
          >
            <LogIn className="h-5 w-5 flex-shrink-0" />
            <span className="hidden lg:block">Entrar</span>
          </button>
        )}
      </div>
    </aside>
  );
}
