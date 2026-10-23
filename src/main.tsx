import { Component, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { error: Error | null };

const screenStyle = {
  minHeight: "100vh",
  boxSizing: "border-box" as const,
  display: "grid",
  placeItems: "center",
  padding: "24px",
  background: "#09090b",
  color: "#fafafa",
  fontFamily: "Inter, system-ui, sans-serif",
};

const cardStyle = {
  width: "100%",
  maxWidth: "680px",
  boxSizing: "border-box" as const,
  padding: "28px",
  background: "#18181b",
  border: "1px solid #3f3f46",
  borderRadius: "16px",
};

function StatusScreen({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main style={screenStyle}>
      <section style={cardStyle}>
        <p
          style={{
            margin: "0 0 10px",
            color: "#f87171",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: ".12em",
            textTransform: "uppercase",
          }}
        >
          Nacional Rock Brasil
        </p>
        <h1 style={{ margin: "0 0 12px", fontSize: "26px", lineHeight: 1.2 }}>
          {title}
        </h1>
        <div style={{ color: "#d4d4d8", lineHeight: 1.65 }}>{children}</div>
      </section>
    </main>
  );
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erro ao renderizar o Nacional Rock Brasil:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <StatusScreen title="O site encontrou um erro ao iniciar">
          <p>
            A aplicação apresentou um erro durante a renderização, em vez de
            carregar a página. Abra as ferramentas do navegador (F12 → Console)
            para consultar o erro registrado.
          </p>
          <details style={{ marginTop: "16px" }}>
            <summary style={{ cursor: "pointer" }}>Detalhes técnicos</summary>
            <pre
              style={{
                marginTop: "10px",
                padding: "12px",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                background: "#09090b",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            >
              {this.state.error.message}
            </pre>
          </details>
        </StatusScreen>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Elemento raiz "root" não encontrado no index.html.');
}

const root = createRoot(rootElement);
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "").trim();

const validSupabaseUrl = (() => {
  try {
    const parsed = new URL(supabaseUrl);
    return (
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      !/SEU-PROJECT-REF/i.test(supabaseUrl)
    );
  } catch {
    return false;
  }
})();

const validSupabaseKey =
  supabaseKey.length > 0 &&
  !/sua-chave|anon-ou-publishable/i.test(supabaseKey);

if (!validSupabaseUrl || !validSupabaseKey) {
  root.render(
    <StatusScreen title="Falta configurar o Supabase">
      <p>
        O site não recebeu as variáveis de ambiente necessárias durante o build.
        Configure-as no Vercel e publique uma nova implantação.
      </p>
      <ol style={{ paddingLeft: "22px" }}>
        <li>
          Em Vercel → Settings → Environment Variables, defina{" "}
          <code>VITE_SUPABASE_URL</code> com a URL do projeto Supabase.
        </li>
        <li>
          Defina <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> com a chave pública
          anon/publishable do mesmo projeto.
        </li>
        <li>
          Marque Production (e Preview, se usar) e faça um novo deploy.
        </li>
      </ol>
      <p style={{ marginBottom: 0, color: "#a1a1aa", fontSize: "13px" }}>
        Use apenas a chave pública no navegador. Nunca coloque a chave
        service_role no front-end.
      </p>
    </StatusScreen>
  );
} else {
  import("./App.tsx")
    .then(({ default: App }) => {
      root.render(
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      );
    })
    .catch((error: unknown) => {
      console.error("Falha ao importar a aplicação Nacional Rock Brasil:", error);
      root.render(
        <StatusScreen title="Não foi possível carregar o site">
          <p>
            O navegador não conseguiu inicializar os módulos da aplicação.
            Consulte o Console do navegador (F12 → Console) e os registros de
            build do Vercel para ver o erro completo.
          </p>
          <details style={{ marginTop: "16px" }}>
            <summary style={{ cursor: "pointer" }}>Detalhes técnicos</summary>
            <pre
              style={{
                marginTop: "10px",
                padding: "12px",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                background: "#09090b",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            >
              {error instanceof Error ? error.message : String(error)}
            </pre>
          </details>
        </StatusScreen>
      );
    });
}
