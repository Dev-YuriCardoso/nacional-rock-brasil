import { AppSidebar } from "./AppSidebar";
import { MusicPlayer } from "./MusicPlayer";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePlayer } from "@/contexts/PlayerContext";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();
  const { currentTrack } = usePlayer();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className={isMobile
        ? currentTrack ? "px-0 pt-16 pb-40" : "px-0 pt-16 pb-24"
        : "ml-16 pb-24 lg:ml-60"
      }>
        {children}
      </main>
      <MusicPlayer />
    </div>
  );
}
