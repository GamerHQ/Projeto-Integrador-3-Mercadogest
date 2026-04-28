import { useEffect } from "react";
import { useStore } from "../store/useStore";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from "recharts";

const fmt = (v) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function KpiCard({ label, value, delta, icon, cor }) {
  const cores = {
    verde:   "border-t-[#2ed573] text-[#2ed573]",
    laranja: "border-t-[#E8622A] text-[#E8622A]",
    amarelo: "border-t-[#f5a623] text-[#f5a623]",
    azul:    "border-t-[#3d8ef5] text-[#3d8ef5]",
  };
  
  return (
    <div className={`bg-[#1e1e1e] border border-[#2a2a2a] border-t-2 ${cores[cor].split(' ')[0]} rounded-2xl p-5 relative overflow-hidden group hover:translate-y-[-2px] transition-all duration-300`}>
      <span className="absolute top-4 right-4 text-2xl opacity-20 group-hover:opacity-40 transition-opacity">{icon}</span>
      <p className="text-[10px] text-[#6b6b6b] uppercase tracking-[2px] font-bold mb-3">{label}</p>
      <p className="text-3xl font-syne font-extrabold text-white tracking-tight mb-1">{value}</p>
      <p className={`text-[11px] font-medium ${cores[cor].split(' ')[1]}`}>{delta}</p>
    </div>
  );
}

export function Dashboard() {
  const { kpis, grafico, vendas, carregarKpis, carregarGrafico, carregarVendas } = useStore();

  useEffect(() => {
    carregarKpis();
    carregarGrafico();
    carregarVendas();
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      {/* KPIs Grid */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        <KpiCard
          label="Receita Hoje"
          value={fmt(kpis?.receita_hoje ?? 0)}
          delta={`Mês: ${fmt(kpis?.receita_mes ?? 0)}`}
          icon="💵" cor="verde"
        />
        <KpiCard
          label="Gastos Hoje"
          value={fmt(kpis?.gastos_hoje ?? 0)}
          delta={`Mês: ${fmt(kpis?.gastos_mes ?? 0)}`}
          icon="📉" cor="laranja"
        />
        <KpiCard
          label="Lucro Líquido"
          value={fmt(kpis?.lucro_hoje ?? 0)}
          delta={`Margem: ${kpis?.receita_mes > 0
            ? ((kpis.lucro_mes / kpis.receita_mes) * 100).toFixed(1)
            : 0}%`}
          icon="✨" cor="amarelo"
        />
        <KpiCard
          label="Vendas Hoje"
          value={kpis?.vendas_hoje ?? 0}
          delta={`${kpis?.vendas_mes ?? 0} no mês`}
          icon="🧾" cor="azul"
        />
      </div>

      {/* Alertas Inteligentes */}
      {(kpis?.produtos_criticos > 0 || kpis?.produtos_baixo > 0) && (
        <div className="flex gap-4 mb-8">
          {kpis.produtos_criticos > 0 && (
            <div className="flex-1 flex items-center gap-3 bg-red-500/5 border border-red-500/20 rounded-2xl px-5 py-3.5 text-sm text-red-400">
              <span className="text-lg">🚨</span>
              <span>Estoque <strong>Crítico</strong>: {kpis.produtos_criticos} itens precisam de atenção imediata.</span>
            </div>
          )}
          {kpis.produtos_baixo > 0 && (
            <div className="flex-1 flex items-center gap-3 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl px-5 py-3.5 text-sm text-yellow-400">
              <span className="text-lg">⚠️</span>
              <span>Estoque <strong>Baixo</strong>: {kpis.produtos_baixo} itens próximos do limite mínimo.</span>
            </div>
          )}
        </div>
      )}

      {/* Charts & Table Section */}
      <div className="grid grid-cols-[1.6fr_1fr] gap-6">
        {/* Gráfico de Desempenho */}
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-syne font-bold text-base flex items-center gap-2">
              <span className="text-green-500">●</span> Balanço de 7 Dias
            </h3>
            <div className="flex gap-4 text-[10px] uppercase tracking-widest font-bold text-[#6b6b6b]">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#2ed573]"></span> Receita</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#ff4757]"></span> Gasto</div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={grafico} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
              <XAxis 
                dataKey="dia" 
                tick={{ fill: "#6b6b6b", fontSize: 10, fontWeight: 600 }} 
                axisLine={false} 
                tickLine={false} 
                dy={10}
              />
              <YAxis 
                tick={{ fill: "#6b6b6b", fontSize: 10 }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(v) => `R$ ${v}`} 
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{ 
                  background: "#161616", 
                  border: "1px solid #2a2a2a", 
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontFamily: "DM Sans"
                }}
              />
              <Bar dataKey="receita" fill="#2ed573" radius={[4, 4, 0, 0]} barSize={12} />
              <Bar dataKey="gasto" fill="#ff4757" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Lista de Vendas */}
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-5 border-b border-[#2a2a2a] bg-[#1e1e1e] flex justify-between items-center">
            <h3 className="font-syne font-bold text-base">Últimas Vendas</h3>
            <span className="text-[10px] bg-[#2a2a2a] px-2 py-1 rounded text-[#6b6b6b] font-bold">HOJE</span>
          </div>
          <div className="divide-y divide-[#2a2a2a] max-h-[310px] overflow-y-auto">
            {vendas.slice(0, 6).map((v) => (
              <div key={v.id} className="flex items-center px-6 py-4 hover:bg-white/[0.02] transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-[#2a2a2a] flex items-center justify-center mr-4 text-xs font-bold text-[#6b6b6b] group-hover:text-[#e8622a] transition-colors">
                  #{v.id.toString().slice(-2)}
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm tracking-tight">{v.forma_pagamento}</p>
                  <p className="text-[#6b6b6b] text-[10px] uppercase font-bold tracking-tighter">{v.criado_em}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#e8622a] font-syne font-bold text-sm">{fmt(v.total)}</p>
                  <p className="text-[9px] text-green-500 font-bold uppercase">Concluída</p>
                </div>
              </div>
            ))}
            {vendas.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 opacity-30">
                <span className="text-3xl mb-2">📥</span>
                <p className="text-xs">Aguardando vendas...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}