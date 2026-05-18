import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { invoke } from "@tauri-apps/api/core";

export function Estoque() {
  const { produtos, carregarProdutos, carregando, atualizarEstoque} = useStore();
  const [repondoId, setRepondoId] = useState(null);
  const [qtdRepor, setQtdRepor] = useState("");

  useEffect(() => { carregarProdutos(); }, []);

  const criticos = produtos.filter((p) => p.estoque_atual <= p.estoque_minimo * 0.3);
  const baixos   = produtos.filter((p) => p.estoque_atual < p.estoque_minimo && p.estoque_atual > p.estoque_minimo * 0.3);
  const ok       = produtos.filter((p) => p.estoque_atual >= p.estoque_minimo);

  const repor = async (id) => {
    if (!qtdRepor || Number(qtdRepor) <= 0) return;
    try {
      await atualizarEstoque(id, qtdRepor);
      setRepondoId(null);
      setQtdRepor("");
    } catch (e) {
      alert("Erro ao atualizar estoque: " + e);
    }
  };

  const statusEstoque = (p) => {
    if (p.estoque_atual <= p.estoque_minimo * 0.3)
      return { label: "Crítico", cor: "text-red-400", dot: "bg-red-500" };
    if (p.estoque_atual < p.estoque_minimo)
      return { label: "Baixo", cor: "text-yellow-400", dot: "bg-yellow-400" };
    return { label: "OK", cor: "text-green-400", dot: "bg-green-400" };
  };

const exportarCSV = async () => {
    let csvContent = "\uFEFFProduto,Categoria,Estoque Atual,Minimo,Maximo,Status\n";
    
    produtos.forEach(p => {
      const st = statusEstoque(p).label;
      const categoria = p.categoria_nome || "Sem categoria";
      csvContent += `${p.nome},${categoria},${p.estoque_atual},${p.estoque_minimo},${p.estoque_maximo},${st}\n`;
    });
    const agora = new Date();
    const dia = String(agora.getDate()).padStart(2, '0');
    const mes = String(agora.getMonth() + 1).padStart(2, '0'); // Mês começa do zero!
    const ano = agora.getFullYear();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');

    const nomeDoArquivo = `relatorio_estoque_${dia}-${mes}-${ano}_${horas}h${minutos}.csv`;

    try {
      // 3. Manda pro Rust o conteúdo e o nome que acabamos de criar!
      const caminhoSalvo = await invoke("salvar_relatorio_csv", { 
        conteudo: csvContent, 
        nomeArquivo: nomeDoArquivo // O Tauri converte "nomeArquivo" do JS para "nome_arquivo" no Rust
      });
      alert("✅ Relatório gerado com sucesso!\nSalvo em: " + caminhoSalvo);
    } catch (e) {
      alert("Erro ao salvar relatório: " + e);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* KPIs com Estilo Padronizado */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <KpiCard smallTitle="Total de Itens" value={produtos.length} color="border-[#3d8ef5]" icon="📦" label="Produtos ativos" />
        <KpiCard smallTitle="Reposição" value={baixos.length} color="border-[#f5a623]" icon="⚠️" label="Estoque baixo" isYellow />
        <KpiCard smallTitle="Crítico" value={criticos.length} color="border-[#ff4757]" icon="🚨" label="Ação imediata" isRed />
      </div>

      {/* Tabela Padronizada */}
      <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-5 border-b border-[#2a2a2a] flex justify-between items-center bg-[#1e1e1e]">
          <h3 className="font-syne font-bold text-lg flex items-center gap-2">
            <span className="text-xl">📊</span> Situação do Estoque
          </h3>
          <button onClick={exportarCSV} className="text-xs bg-[#2a2a2a] hover:bg-[#333] text-white px-4 py-2 rounded-xl transition-all border border-[#333]">
            Exportar Relatório
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#161616]/50 border-b border-[#2a2a2a]">
                {["Produto", "Estoque Atual", "Mín / Máx", "Validade", "Status", "Ação"].map((h) => (
                  <th key={h} className="text-left text-[11px] text-[#6b6b6b] uppercase tracking-[1.5px] px-6 py-4 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {carregando ? (
                <tr><td colSpan={6} className="text-center py-20 text-[#6b6b6b] animate-pulse">Carregando dados do servidor...</td></tr>
              ) : (
                [...criticos, ...baixos, ...ok].map((p) => {
                  const st = statusEstoque(p);
                  const pct = Math.min(100, (p.estoque_atual / Math.max(p.estoque_maximo, 1)) * 100);
                  
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl opacity-80 group-hover:opacity-100 transition-opacity">{p.categoria_emoji || '📦'}</span>
                          <span className="font-bold text-sm text-[#f0ede8]">{p.nome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-sm font-syne font-bold">{p.estoque_atual} <span className="text-[#6b6b6b] font-normal text-xs">{p.unidade}</span></span>
                          <div className="w-24 bg-[#2a2a2a] h-1.5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${pct}%`, 
                                background: pct < 20 ? "#ff4757" : pct < 50 ? "#f5a623" : "#2ed573" 
                              }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#6b6b6b] font-medium">
                        {p.estoque_minimo} / {p.estoque_maximo}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#6b6b6b]">
                        {p.validade || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${st.cor} bg-black/20 border border-white/5`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {repondoId === p.id ? (
                          <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                            <input
                              type="number"
                              value={qtdRepor}
                              onChange={(e) => setQtdRepor(e.target.value)}
                              className="w-16 bg-[#0d0d0d] border border-[#333] rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-[#e8622a]"
                              autoFocus
                            />
                            <button onClick={() => repor(p.id)} className="bg-green-600 hover:bg-green-500 text-white p-1.5 rounded-lg text-xs transition-colors">✓</button>
                            <button onClick={() => setRepondoId(null)} className="bg-[#2a2a2a] text-white p-1.5 rounded-lg text-xs">✕</button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => { setRepondoId(p.id); setQtdRepor(""); }}
                            className={`text-[11px] px-4 py-2 rounded-xl transition-all font-bold uppercase tracking-widest
                              ${st.label !== "OK" 
                                ? "bg-[#e8622a] text-white hover:shadow-[0_0_15px_rgba(232,98,42,0.3)] hover:bg-[#d4531f]" 
                                : "bg-[#2a2a2a] text-[#6b6b6b] hover:text-white border border-transparent hover:border-[#444]"
                              }`}
                          >
                            {st.label !== "OK" ? "Repor" : "Ajustar"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


function KpiCard({ smallTitle, value, color, icon, label, isRed, isYellow }) {
  return (
    <div className={`bg-[#1e1e1e] border-t-2 ${color} border border-[#2a2a2a] rounded-2xl p-6 shadow-lg hover:translate-y-[-2px] transition-all duration-300`}>
      <div className="flex justify-between items-start mb-3">
        <p className="text-[10px] text-[#6b6b6b] uppercase tracking-[2px] font-bold">{smallTitle}</p>
        <span className="text-xl opacity-40">{icon}</span>
      </div>
      <p className={`text-4xl font-syne font-extrabold mb-1 ${isRed ? 'text-red-500' : isYellow ? 'text-yellow-400' : 'text-white'}`}>
        {value}
      </p>
      <p className="text-[11px] text-[#6b6b6b] font-medium tracking-wide">{label}</p>
    </div>
  );
}