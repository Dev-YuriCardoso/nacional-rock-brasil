import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Guitar, Music, Headphones } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import TermsModal from "@/components/TermsModal";

const genres = [
  "Death Metal", "Thrash Metal", "Black Metal", "Power Metal",
  "Symphonic Metal", "Nu-Metal", "Emo", "Punk", "Goth",
  "Hard Rock", "Alternative", "Metal",
];

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [userType, setUserType] = useState<"fã" | "banda">("fã");
  const [genre, setGenre] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        if (!acceptedTerms) {
          toast({
            title: "Termos de Uso",
            description: "Você precisa aceitar os termos para continuar.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        // Validate password complexity
        if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
          toast({
            title: "Senha fraca",
            description: "A senha deve ter no mínimo 8 caracteres, incluindo 1 letra maiúscula e 1 número.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              username,
              user_type: userType,
              genre: userType === "banda" ? genre : "",
              accepted_terms: true,
            },
          },
        });
        if (error) throw error;

        // O banco (trigger handle_new_user) cria o perfil. Se a confirmação de e-mail
        // estiver desligada no Supabase, o cadastro já abre a sessão e entramos direto.
        if (signUpData.session) {
          navigate("/");
          return;
        }

        toast({
          title: "Conta criada!",
          description: "Verifique seu email para confirmar o cadastro.",
          duration: 8000,
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      const msg = error.message || "";
      let description = msg;
      if (msg.includes("Invalid login credentials")) {
        description = "Email ou senha incorretos.";
      } else if (msg.includes("Email not confirmed")) {
        description = "Confirme seu email antes de entrar.";
      } else if (msg.includes("email rate limit")) {
        description = "Muitas tentativas. Aguarde alguns minutos.";
      } else if (msg.toLowerCase().includes("invalid") && msg.toLowerCase().includes("email")) {
        description = "Endereço de email inválido.";
      } else if (msg.includes("already registered")) {
        description = "Este email já está cadastrado.";
      }
      toast({
        title: "Erro",
        description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side - decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 gradient-rock opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-br from-background via-transparent to-background" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <Guitar className="h-24 w-24 text-primary mb-6 glow-red" />
          <h2 className="font-display text-6xl text-foreground tracking-wider mb-4">ROCK BR</h2>
          <p className="text-muted-foreground text-center max-w-md text-lg">
            A plataforma definitiva do rock e metal brasileiro. Conecte-se com bandas, descubra novos sons e viva a cena.
          </p>
          <div className="flex gap-6 mt-10">
            <div className="flex flex-col items-center gap-1">
              <Music className="h-8 w-8 text-primary" />
              <span className="text-xs text-muted-foreground">Bandas</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Headphones className="h-8 w-8 text-primary" />
              <span className="text-xs text-muted-foreground">Fãs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="flex flex-col items-center gap-2 lg:hidden">
            <Guitar className="h-12 w-12 text-primary" />
            <h1 className="font-display text-4xl text-foreground tracking-wider">ROCK BR</h1>
          </div>

          <div className="text-center lg:text-left">
            <h1 className="font-display text-3xl text-foreground">
              {isLogin ? "BEM-VINDO DE VOLTA" : "JUNTE-SE À CENA"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isLogin ? "Entre na sua conta" : "Crie sua conta e faça parte"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6">
            {!isLogin && (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">Nome de usuário</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    placeholder="Seu nome ou nome da banda"
                  />
                </div>

                {/* User Type Selection */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">Você é</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setUserType("fã")}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                        userType === "fã"
                          ? "border-primary bg-primary/10 text-primary glow-red"
                          : "border-border bg-background text-muted-foreground hover:border-muted-foreground"
                      }`}
                    >
                      <Headphones className="h-5 w-5" />
                      Fã
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserType("banda")}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                        userType === "banda"
                          ? "border-primary bg-primary/10 text-primary glow-red"
                          : "border-border bg-background text-muted-foreground hover:border-muted-foreground"
                      }`}
                    >
                      <Music className="h-5 w-5" />
                      Banda
                    </button>
                  </div>
                </div>

                {userType === "banda" && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">Gênero musical</label>
                    <select
                      required
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
                    >
                      <option value="">Selecione um gênero</option>
                      {genres.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                placeholder="Mínimo 8 caracteres, 1 maiúscula e 1 número"
                minLength={8}
              />
              {!isLogin && password.length > 0 && (!/[A-Z]/.test(password) || !/[0-9]/.test(password) || password.length < 8) && (
                <p className="text-xs text-destructive mt-1">
                  A senha deve ter no mínimo 8 caracteres, incluindo 1 letra maiúscula e 1 número.
                </p>
              )}
            </div>

            {!isLogin && (
              <>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                    Li e concordo com os{" "}
                    <TermsModal>
                      <button type="button" className="text-primary hover:underline font-medium">
                        Termos de Uso
                      </button>
                    </TermsModal>{" "}
                    e autorizo o processamento dos meus dados conforme a política da plataforma.
                  </label>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading || (!isLogin && !acceptedTerms)}
              className="h-12 w-full rounded-lg gradient-rock text-primary-foreground font-display text-xl tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 glow-red"
            >
              {loading ? "CARREGANDO..." : isLogin ? "ENTRAR" : "CRIAR CONTA"}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? "Não tem conta? " : "Já tem conta? "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? "Cadastre-se" : "Entrar"}
              </button>
            </p>
          </form>

          <div className="text-center">
            <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              ← Voltar para o site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
