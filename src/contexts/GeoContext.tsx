import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface GeoContextType {
  detectedState: string;
  loading: boolean;
}

const GeoContext = createContext<GeoContextType>({ detectedState: "", loading: true });

export const useGeo = () => useContext(GeoContext);

const REGION_TO_UF: Record<string, string> = {
  "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM",
  "Bahia": "BA", "Ceará": "CE", "Distrito Federal": "DF", "Espírito Santo": "ES",
  "Goiás": "GO", "Maranhão": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS",
  "Minas Gerais": "MG", "Pará": "PA", "Paraíba": "PB", "Paraná": "PR",
  "Pernambuco": "PE", "Piauí": "PI", "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN",
  "Rio Grande do Sul": "RS", "Rondônia": "RO", "Roraima": "RR", "Santa Catarina": "SC",
  "São Paulo": "SP", "Sergipe": "SE", "Tocantins": "TO",
};

export const GeoProvider = ({ children }: { children: ReactNode }) => {
  const [detectedState, setDetectedState] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = sessionStorage.getItem("detected_uf");
    if (cached) {
      setDetectedState(cached);
      setLoading(false);
      return;
    }

    fetch("https://ipapi.co/json/")
      .then((r) => r.json())
      .then((data) => {
        if (data.country_code === "BR" && data.region) {
          const uf = REGION_TO_UF[data.region] || data.region_code || "";
          setDetectedState(uf);
          if (uf) sessionStorage.setItem("detected_uf", uf);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <GeoContext.Provider value={{ detectedState, loading }}>
      {children}
    </GeoContext.Provider>
  );
};
