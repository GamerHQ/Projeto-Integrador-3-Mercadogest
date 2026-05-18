import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { invoke } from "@tauri-apps/api/core";

const fmt = (v) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const CATEGORIAS_SAIDA = ["Mercadoria", "Funcionários", "Energia/Água", "Aluguel", "Manutenção", "Outros"];
const vazio = { tipo: "saida", descricao: "", valor: "", categoria: "Mercadoria" };

// Sub-componente de KPI para manter o padrão do Dashboard
function FinKpiCard({ label, value, subtext, colorClass, isTrendUp }) {
  return (
    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-6 shadow-lg">
      <p className="text-[10px] text-[#6b6b6b] uppercase tracking-[2px] font-bold mb-3">{label}</p>
      <p className={`text-3xl font-syne font-extrabold tracking-tight ${colorClass}`}>
        {value}
      </p>
      <p className="text-[11px] text-[#6b6b6b] mt-2 font-medium">{subtext}</p>
    </div>
  );
}

export function Financeiro() {
  const { lancamentos, kpis, carregarLancamentos, carregarKpis, criarLancamento, carregando, atualizarLancamento, excluirLancamento } = useStore();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ tipo: "ENTRADA", descricao: "", valor: "", categoria: "" });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    carregarLancamentos();
    carregarKpis();
  }, []);

  const salvar = async () => {
    if (!form.descricao || form.valor === "" || form.valor === undefined) {
      alert("⛔ O código parou aqui: A descrição ou o valor estão vazios no sistema!");
      return;
    }
    try {
        const dadosDoForm = {
        tipo: form.tipo.toLowerCase(),
        descricao: form.descricao,
        valor: Number(form.valor),
        categoria: form.tipo === "saida" ? form.categoria : null,
      };
      if (editId && !atualizarLancamento) {
        alert("⛔ ERRO GRAVE: O botão não acha a função atualizarLancamento dentro do seu useStore.js!");
        return;
      }
      if (editId) {
        await atualizarLancamento(editId, dadosDoForm);
      } else {
        await criarLancamento(dadosDoForm);
      }
      setModal(false);
    } catch (e) {
      alert("❌ Erro que veio lá do Banco de Dados/Rust: " + e);
    }
  };

  const exportarFinanceiroCSV = async () => {
    let csvContent = "\uFEFFTipo,Descrição,Valor (R$),Categoria\n";
    
    lancamentos.forEach(l => {
      csvContent += `${l.tipo},${l.descricao},${l.valor},${l.categoria}\n`;
    });

    const agora = new Date();
    const dia = String(agora.getDate()).padStart(2, '0');
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const ano = agora.getFullYear();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    const nomeDoArquivo = `relatorio_financeiro_${dia}-${mes}-${ano}_${horas}h${minutos}.csv`;

    try {
      const caminhoSalvo = await invoke("salvar_relatorio_csv", { 
        conteudo: csvContent, 
        nomeArquivo: nomeDoArquivo 
      });
      alert("✅ Relatório Financeiro gerado com sucesso!\nSalvo em: " + caminhoSalvo);
    } catch (e) {
      alert("Erro ao exportar financeiro: " + e);
  }
};

const abrirNovo = () => {
    setForm({ tipo: "ENTRADA", descricao: "", valor: "", categoria: "" });
    setEditId(null);
    setModal(true);
  };

  const abrirEditar = (lancamentoClicado) => {
    setForm({
      tipo: lancamentoClicado.tipo,
      descricao: lancamentoClicado.descricao,
      valor: lancamentoClicado.valor,
      categoria: lancamentoClicado.categoria
    });
    setEditId(lancamentoClicado.id);
    setModal(true);
  };

  const gastosPorCat = lancamentos
    .filter((l) => l.tipo === "saida")
    .reduce((acc, l) => {
      const cat = l.categoria ?? "Outros";
      acc[cat] = (acc[cat] ?? 0) + l.valor;
      return acc;
    }, {});

  const totalGastos = Object.values(gastosPorCat).reduce((a, b) => a + b, 0);

  return (
    <div className="animate-in fade-in duration-500">
      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <FinKpiCard 
          label="Receita Bruta — Mês" 
          value={fmt(kpis?.receita_mes ?? 0)} 
          subtext={`Hoje: ${fmt(kpis?.receita_hoje ?? 0)}`}
          colorClass="text-[#2ed573]"
        />
        <FinKpiCard 
          label="Gastos Totais — Mês" 
          value={fmt(kpis?.gastos_mes ?? 0)} 
          subtext={`Hoje: ${fmt(kpis?.gastos_hoje ?? 0)}`}
          colorClass="text-[#ff4757]"
        />
        <FinKpiCard 
          label="Lucro Líquido — Mês" 
          value={fmt(kpis?.lucro_mes ?? 0)} 
          subtext={`Margem: ${kpis?.receita_mes > 0 ? ((kpis.lucro_mes / kpis.receita_mes) * 100).toFixed(1) : 0}%`}
          colorClass="text-[#f5a623]"
        />
      </div>

      <div className="grid grid-cols-[1.6fr_1fr] gap-6">
        {/* Lançamentos */}
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-5 border-b border-[#2a2a2a] flex justify-between items-center bg-[#1e1e1e]">
            <h3 className="font-syne font-bold text-base flex items-center gap-2">
              <span className="text-xl">📋</span> Lançamentos Recentes
            </h3>
            <div className="flex gap-2">
              <button onClick={exportarFinanceiroCSV} className="text-xs bg-[#2a2a2a] hover:bg-[#333] text-white px-4 py-2 rounded-xl transition-all border border-[#333]">
                Exportar Relatório
              </button>
              <button
                onClick={abrirNovo} // Chamando abrirNovo ao invés de setModal(true) direto
                className="bg-[#E8622A] hover:bg-[#d4531f] text-white px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-orange-900/20"
              >
                + Novo Lançamento
              </button>
            </div>
          </div>

          <div className="divide-y divide-[#2a2a2a] max-h-[500px] overflow-y-auto">
            {carregando ? (
              <p className="text-center text-[#6b6b6b] py-12 text-sm animate-pulse">Carregando movimentações...</p>
            ) : (
              lancamentos.map((l) => (
                <div key={l.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-inner
                    ${l.tipo === "entrada" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    {l.tipo === "entrada" ? "💵" : "📤"}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#f0ede8] truncate">{l.descricao}</p>
                    <p className="text-[10px] text-[#6b6b6b] font-bold uppercase tracking-tighter">
                      {l.categoria ?? "Geral"} • {l.criado_em}
                    </p>
                  </div>
                  
                  <span className={`font-syne font-bold text-sm mr-4 ${l.tipo === "entrada" ? "text-[#2ed573]" : "text-[#ff4757]"}`}>
                    {l.tipo === "entrada" ? "+" : "−"} {fmt(l.valor)}
                  </span>

                  {/* BOTÕES DE EDITAR E EXCLUIR NO LUGAR CERTO */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => abrirEditar(l)}
                      className="text-[10px] bg-[#2a2a2a] hover:bg-[#333] text-white px-3 py-1.5 rounded-lg transition-all font-bold uppercase tracking-wider"
                    >
                      Editar
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm(`Deseja realmente estornar o lançamento: "${l.descricao}"?`)) {
                          try {
                            await excluirLancamento(l.id);
                          } catch (e) {
                            alert("Erro ao excluir: " + e);
                          }
                        }
                      }}
                      className="text-[10px] bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg transition-all font-bold uppercase tracking-wider"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))
            )}
            {!carregando && lancamentos.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 opacity-30">
                <span className="text-4xl mb-2">📒</span>
                <p className="text-xs">Nenhum lançamento registrado</p>
              </div>
            )}
          </div>
        </div>

        {/* Composição de gastos */}
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-xl self-start">
          <div className="px-6 py-5 border-b border-[#2a2a2a] font-syne font-bold text-base">
            🥧 Composição de Gastos
          </div>
          <div className="p-6 space-y-6">
            {Object.entries(gastosPorCat)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, valor]) => {
                const pct = totalGastos > 0 ? ((valor / totalGastos) * 100).toFixed(1) : 0;
                return (
                  <div key={cat} className="group">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-[#f0ede8] font-bold uppercase tracking-wider">{cat}</span>
                      <span className="font-syne font-bold text-[#f0ede8]">
                        {fmt(valor)} <span className="text-[#6b6b6b] text-[10px] ml-1">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 bg-[#0d0d0d] rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#E8622A] to-[#f5a623] transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            {Object.keys(gastosPorCat).length === 0 && (
              <p className="text-center text-[#6b6b6b] text-xs py-10 italic">Aguardando dados de saída...</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal novo/editar lançamento */}
      {modal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in duration-300 px-4">
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-3xl w-full max-w-[420px] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-syne font-bold text-xl tracking-tight">
                {editId ? "Editar Lançamento" : "Novo Lançamento"}
              </h2>
              <button onClick={() => setModal(false)} className="w-8 h-8 flex items-center justify-center bg-[#2a2a2a] hover:bg-[#333] rounded-full text-xs text-[#6b6b6b] transition-colors">✕</button>
            </div>

            <div className="flex gap-2 mb-6">
              {["entrada", "saida"].map((t) => (
                <button key={t} onClick={() => setForm({ ...form, tipo: t })}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[1.5px] transition-all border
                    ${form.tipo === t
                      ? t === "entrada" ? "bg-green-500/10 border-green-500 text-green-400"
                                        : "bg-red-500/10 border-red-500 text-red-400"
                      : "bg-[#0d0d0d] border-[#2a2a2a] text-[#6b6b6b] hover:border-[#444]"
                    }`}>
                  {t === "entrada" ? "💵 Entrada" : "📤 Saída"}
                </button>
              ))}
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[10px] text-[#6b6b6b] uppercase tracking-widest font-bold block mb-2 ml-1">Descrição</label>
                <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#E8622A] transition-all"
                  placeholder="Ex: Pagamento Fornecedor" />
              </div>
              <div>
                <label className="text-[10px] text-[#6b6b6b] uppercase tracking-widest font-bold block mb-2 ml-1">Valor (R$)</label>
                <input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#E8622A] transition-all font-syne"
                  placeholder="0.00" />
              </div>
              {form.tipo === "saida" && (
                <div className="animate-in slide-in-from-top-2">
                  <label className="text-[10px] text-[#6b6b6b] uppercase tracking-widest font-bold block mb-2 ml-1">Categoria</label>
                  <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    className="w-full bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#E8622A] transition-all appearance-none cursor-pointer">
                    {CATEGORIAS_SAIDA.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => setModal(false)}
                className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all">
                Cancelar
              </button>
              <button onClick={salvar}
                className="flex-[1.5] bg-[#E8622A] hover:bg-[#d4531f] text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-orange-900/30">
                ✅ {editId ? "Salvar Alterações" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}