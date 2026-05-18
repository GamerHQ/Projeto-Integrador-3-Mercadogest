import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip
} from "recharts";

const fmt = (v) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const CORES_PIE = ["#E8622A", "#3d8ef5", "#2ed573", "#f5a623", "#c864ff", "#ff4757"];

function RelatorioKpi({ label, value, subtext, colorBorder, icon }) {
  return (
    <div className={`bg-[#1e1e1e] border border-[#2a2a2a] border-t-2 ${colorBorder} rounded-2xl p-6 shadow-xl`}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-[10px] text-[#6b6b6b] uppercase tracking-[2px] font-bold">{label}</p>
        <span className="text-xl opacity-30">{icon}</span>
      </div>
      <p className="text-3xl font-syne font-extrabold text-[#f0ede8] tracking-tight mb-1">{value}</p>
      <p className="text-[11px] text-[#6b6b6b] font-medium uppercase tracking-wider">{subtext}</p>
    </div>
  );
}

const formatarDataBR = (dataStr) => {
  if (!dataStr) return "—";

  let data = new Date(dataStr.replace(' ', 'T'));

  if (isNaN(data.getTime())) {
    data = new Date(dataStr);
  }
  if (!isNaN(data.getTime())) {
    const dataBR = data.toLocaleDateString("pt-BR");
    const horaBR = data.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
    return `${dataBR} ${horaBR}`;
  }
  return dataStr; 
};

export function Relatorios() {
  const { kpis, topProdutos, pagamentos, vendas, carregarRelatorios, carregarKpis, carregando } = useStore();
  
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroDataInicio, setFiltroDataInicio] = useState("");
  const [filtroDataFim, setFiltroDataFim] = useState("");
  const [filtroPagamento, setFiltroPagamento] = useState("Todos");

  useEffect(() => {
    carregarRelatorios();
    carregarKpis();
  }, []);

  const maxTop = topProdutos[0]?.total ?? 1;

  const vendasFiltradas = vendas.filter(v => {
    let passa = true;

    if (filtroPagamento !== "Todos") {
      if (v.forma_pagamento.toLowerCase() !== filtroPagamento.toLowerCase()) passa = false;
    }

    if (filtroDataInicio || filtroDataFim) {
      let ano, mes, dia;
      
      if (v.criado_em.includes('/')) {
        const dataPartes = v.criado_em.split(' ')[0].split('/');
        dia = Number(dataPartes[0]);
        mes = Number(dataPartes[1]) - 1; // O JS começa a contar os meses do 0 (Janeiro = 0)
        ano = Number(dataPartes[2]);
      } else {
        const dataPartes = v.criado_em.split(' ')[0].split('-');
        ano = Number(dataPartes[0]);
        mes = Number(dataPartes[1]) - 1;
        dia = Number(dataPartes[2]);
      }

      const dataVenda = new Date(ano, mes, dia, 12, 0, 0);

      if (filtroDataInicio) {
        const p = filtroDataInicio.split('-'); 
        const inicio = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 0, 0, 0);
        if (dataVenda < inicio) passa = false;
      }

      if (filtroDataFim) {
        const p = filtroDataFim.split('-');
        const fim = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 23, 59, 59);
        if (dataVenda > fim) passa = false;
      }
    }

    return passa;
  });

  const limparFiltros = () => {
    setFiltroDataInicio("");
    setFiltroDataFim("");
    setFiltroPagamento("Todos");
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* KPIs Analíticos */}
      <div className="grid grid-cols-3 gap-6">
        <RelatorioKpi 
          label="Receita do Mês" 
          value={fmt(kpis?.receita_mes ?? 0)} 
          subtext={`${kpis?.vendas_mes ?? 0} vendas realizadas`}
          colorBorder="border-t-[#2ed573]"
          icon="🏆"
        />
        <RelatorioKpi 
          label="Ticket Médio" 
          value={kpis?.vendas_mes > 0 ? fmt(kpis.receita_mes / kpis.vendas_mes) : fmt(0)} 
          subtext="Média por pedido"
          colorBorder="border-t-[#3d8ef5]"
          icon="🧾"
        />
        <RelatorioKpi 
          label="Lucro Líquido" 
          value={fmt(kpis?.lucro_mes ?? 0)} 
          subtext={`Margem Real: ${kpis?.receita_mes > 0 ? ((kpis.lucro_mes / kpis.receita_mes) * 100).toFixed(1) : 0}%`}
          colorBorder="border-t-[#f5a623]"
          icon="✨"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-5 border-b border-[#2a2a2a] flex justify-between items-center bg-[#1e1e1e]">
            <h3 className="font-syne font-bold text-base">🏆 Ranking de Produtos</h3>
            <span className="text-[10px] text-[#6b6b6b] font-bold uppercase tracking-widest">Top 5</span>
          </div>
          <div className="p-6 space-y-6">
            {carregando ? (
              <div className="py-10 text-center text-[#6b6b6b] animate-pulse">Calculando ranking...</div>
            ) : (
              topProdutos.map((p, i) => {
                const pct = (p.total / maxTop) * 100;
                const medalhas = ["🥇", "🥈", "🥉", "4.", "5."];
                return (
                  <div key={p.nome} className="group">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-lg font-bold w-6 text-[#6b6b6b] group-hover:text-[#e8622a] transition-colors">
                        {medalhas[i]}
                      </span>
                      <div className="flex-1 flex justify-between">
                        <span className="text-sm font-bold text-white uppercase tracking-tight">{p.nome}</span>
                        <span className="text-sm font-syne font-bold text-[#e8622a]">{fmt(p.total)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-[#0d0d0d] rounded-full overflow-hidden ml-10">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-[#e8622a] to-[#f5a623] transition-all duration-1000" 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                    <p className="text-[10px] text-[#6b6b6b] ml-10 mt-1 uppercase font-bold tracking-tighter">
                      {p.quantidade} unidades vendidas
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-5 border-b border-[#2a2a2a] font-syne font-bold text-base bg-[#1e1e1e]">
            💳 Métodos de Pagamento
          </div>
          <div className="p-6">
            {pagamentos.length > 0 ? (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pagamentos}
                      dataKey="total"
                      nameKey="forma"
                      cx="50%" cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      stroke="none"
                    >
                      {pagamentos.map((_, i) => (
                        <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: "#161616", border: "1px solid #2a2a2a", borderRadius: "10px", fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-6 w-full px-4">
                  {pagamentos.map((p, i) => (
                    <div key={p.forma} className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: CORES_PIE[i % CORES_PIE.length] }} />
                        <span className="text-[10px] font-bold text-[#6b6b6b] uppercase tracking-wider">{p.forma}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-syne font-bold text-[#f0ede8]">{p.percentual}%</span>
                        <span className="text-[10px] text-[#6b6b6b]">{fmt(p.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-[#6b6b6b] italic text-sm">Sem dados de pagamento.</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-5 border-b border-[#2a2a2a] font-syne font-bold text-base flex justify-between items-center">
          <span>🧾 Histórico Detalhado</span>
          <button 
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={`text-[10px] hover:bg-[#333] text-white px-3 py-1.5 rounded-lg font-bold uppercase tracking-widest transition-all ${mostrarFiltros ? 'bg-[#e8622a] hover:bg-[#d4531f]' : 'bg-[#2a2a2a]'}`}
          >
            Filtros Avançados
          </button>
        </div>

        {mostrarFiltros && (
          <div className="px-6 py-4 bg-[#161616] border-b border-[#2a2a2a] flex items-end gap-4 animate-in slide-in-from-top-2">
            <div>
              <label className="text-[10px] text-[#6b6b6b] uppercase tracking-widest font-bold block mb-1">Data Início</label>
              <input 
                type="date" 
                value={filtroDataInicio}
                onChange={(e) => setFiltroDataInicio(e.target.value)}
                className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#E8622A] cursor-pointer" 
              />
            </div>
            <div>
              <label className="text-[10px] text-[#6b6b6b] uppercase tracking-widest font-bold block mb-1">Data Fim</label>
              <input 
                type="date" 
                value={filtroDataFim}
                onChange={(e) => setFiltroDataFim(e.target.value)}
                className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#E8622A] cursor-pointer" 
              />
            </div>
            <div>
              <label className="text-[10px] text-[#6b6b6b] uppercase tracking-widest font-bold block mb-1">Pagamento</label>
              <select 
                value={filtroPagamento}
                onChange={(e) => setFiltroPagamento(e.target.value)}
                className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#E8622A] cursor-pointer"
              >
                <option value="Todos">Todos</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão">Cartão</option>
                <option value="Pix">Pix</option>
              </select>
            </div>
            <button 
              onClick={limparFiltros}
              className="mb-[2px] text-xs text-[#6b6b6b] hover:text-white px-3 py-1.5 underline decoration-dotted underline-offset-4"
            >
              Limpar Filtros
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#161616]/50 border-b border-[#2a2a2a]">
                {["ID", "Data / Hora", "Total", "Desconto", "Pagamento", "Status"].map((h) => (
                  <th key={h} className="px-6 py-4 text-[11px] text-[#6b6b6b] font-bold uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {vendasFiltradas.map((v) => (
                <tr key={v.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 text-sm font-bold text-[#6b6b6b] group-hover:text-[#e8622a]">#{v.id}</td>
                  <td className="px-6 py-4 text-xs font-medium text-[#f0ede8]">{formatarDataBR(v.criado_em)}</td>
                  <td className="px-6 py-4 text-sm font-syne font-bold text-[#e8622a]">{fmt(v.total)}</td>
                  <td className="px-6 py-4 text-xs font-bold text-green-500 uppercase tracking-tighter">
                    {v.desconto > 0 ? `-${fmt(v.desconto)}` : "—"}
                  </td>
                  <td className="px-6 py-4 text-[11px] font-bold uppercase text-[#6b6b6b] tracking-widest">{v.forma_pagamento}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-widest border border-green-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" /> {v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {vendasFiltradas.length === 0 && (
            <div className="py-20 text-center text-[#6b6b6b] opacity-30 flex flex-col items-center">
              <span className="text-3xl mb-2">📂</span>
              <p className="text-sm font-medium uppercase tracking-widest">Nenhuma venda encontrada nos filtros</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}