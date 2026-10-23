import { AppSidebar } from "./AppSidebar";
import { MusicPlayer } from "./MusicPlayer";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className={isMobile ? "pb-36" : "ml-16 lg:ml-56 pb-24"}>
        {children}
      </main>
      {!isMobile && <MusicPlayer />}
    </div>
  );
}
