import { useStore } from "./store/useStore";
import { Sidebar }    from "./components/Sidebar";
import { Dashboard }  from "./components/Dashboard";
import { PDV }        from "./components/PDV";
import { Produtos }   from "./components/Produtos";
import { Estoque }    from "./components/Estoque";
import { Financeiro } from "./components/Financeiro";
import { Relatorios } from "./components/Relatorios";

const titulos = {
  dashboard:  "📊 Dashboard",
  pdv:        "🛒 Frente de Caixa — PDV",
  produtos:   "📦 Produtos",
  estoque:    "🏷️ Controle de Estoque",
  financeiro: "💰 Financeiro",
  relatorios: "📈 Relatórios",
};

const telas = {
  dashboard:  <Dashboard />,
  pdv:        <PDV />,
  produtos:   <Produtos />,
  estoque:    <Estoque />,
  financeiro: <Financeiro />,
  relatorios: <Relatorios />,
};

export default function App() {
  const { pagina } = useStore();

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white font-sans">
      <Sidebar />

      <main className="ml-60 min-h-screen flex flex-col">
        {/* Topbar */}
        <div className="sticky top-0 z-40 bg-[#0d0d0d]/90 backdrop-blur border-b border-[#2a2a2a] px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">{titulos[pagina]}</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-2 text-sm text-[#6b6b6b] w-56">
              🔍 Buscar...
            </div>
            <button className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 py-2 text-sm hover:bg-[#2a2a2a] transition-all">
              🔔
            </button>
          </div>
        </div>

        {/* Conteúdo da página */}
        <div className="p-8 flex-1">
          {telas[pagina] ?? <Dashboard />}
        </div>
      </main>
    </div>
  );
}