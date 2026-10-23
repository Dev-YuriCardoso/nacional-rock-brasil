import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { GeoProvider } from "@/contexts/GeoContext";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { Layout } from "./components/Layout";
import Index from "./pages/Index";
import Artists from "./pages/Artists";
import ArtistDetail from "./pages/ArtistDetail";
import Events from "./pages/Events";
import Auth from "./pages/Auth";
import BandDashboard from "./pages/BandDashboard";
import AdminPanel from "./pages/AdminPanel";
import MyProfile from "./pages/MyProfile";
import UserProfile from "./pages/UserProfile";
import SearchUsers from "./pages/SearchUsers";
import Classifieds from "./pages/Classifieds";
import Marketplace from "./pages/Marketplace";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <GeoProvider>
        <PlayerProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Layout><Index /></Layout>} />
            <Route path="/artistas" element={<Layout><Artists /></Layout>} />
            <Route path="/artista/:id" element={<Layout><ArtistDetail /></Layout>} />
            <Route path="/eventos" element={<Layout><Events /></Layout>} />
            <Route path="/dashboard" element={<Layout><BandDashboard /></Layout>} />
            <Route path="/admin" element={<Layout><AdminPanel /></Layout>} />
            <Route path="/perfil" element={<Layout><MyProfile /></Layout>} />
            <Route path="/usuario/:id" element={<Layout><UserProfile /></Layout>} />
            <Route path="/buscar" element={<Layout><SearchUsers /></Layout>} />
            <Route path="/classificados" element={<Layout><Classifieds /></Layout>} />
            <Route path="/loja" element={<Layout><Marketplace /></Layout>} />
            <Route path="/news" element={<Layout><Index /></Layout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </PlayerProvider>
        </GeoProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
