import { useEffect, useState, useCallback } from "react";
import { useStore } from "../store/useStore";

const fmt = (v) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const UNIDADES = ["kg", "unidade", "litro", "pacote", "caixa", "duzia"];

const vazio = {
  nome: "", codigo_barras: "", categoria_id: null,
  unidade: "kg", custo: "", preco_venda: "",
  estoque_atual: "", estoque_minimo: "", estoque_maximo: "",
  validade: "",
};

export function Produtos() {
  const {
    produtos, categorias, carregando,
    carregarProdutos, carregarCategorias,
    criarProduto, atualizarProduto, excluirProduto,
  } = useStore();

  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState(vazio);
  const [editId, setEditId] = useState(null);
  const [busca, setBusca]   = useState("");
  const [catFiltro, setCatFiltro] = useState("todos");

  useEffect(() => {
    carregarProdutos();
    carregarCategorias();
  }, []);

  const abrirNovo = () => { setForm(vazio); setEditId(null); setModal(true); };
  const abrirEditar = (p) => {
    setForm({
      nome: p.nome, codigo_barras: p.codigo_barras ?? "",
      categoria_id: p.categoria_id, unidade: p.unidade,
      custo: p.custo, preco_venda: p.preco_venda,
      estoque_atual: p.estoque_atual, estoque_minimo: p.estoque_minimo,
      estoque_maximo: p.estoque_maximo, validade: p.validade ?? "",
    });
    setEditId(p.id);
    setModal(true);
  };

  const salvar = async () => {
    const payload = {
      ...form,
      categoria_id:   form.categoria_id ? Number(form.categoria_id) : null,
      custo:          Number(form.custo),
      preco_venda:    Number(form.preco_venda),
      estoque_atual:  Number(form.estoque_atual),
      estoque_minimo: Number(form.estoque_minimo),
      estoque_maximo: Number(form.estoque_maximo),
      codigo_barras:  form.codigo_barras || null,
      validade:       form.validade || null,
    };
    try {
      if (editId) await atualizarProduto(editId, payload);
      else        await criarProduto(payload);
      setModal(false);
    } catch (e) {
      alert("Erro ao salvar: " + e);
    }
  };

  const produtos_filtrados = produtos.filter((p) => {
    const okBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    const okCat   = catFiltro === "todos" || String(p.categoria_id) === catFiltro;
    return okBusca && okCat;
  });

  const margem = (c, v) => (v > 0 ? (((v - c) / v) * 100).toFixed(0) : 0);

  const statusEstoque = (p) => {
    if (p.estoque_atual <= p.estoque_minimo * 0.3) return { label: "Crítico", cor: "text-red-400", dot: "bg-red-500" };
    if (p.estoque_atual < p.estoque_minimo)        return { label: "Baixo",   cor: "text-yellow-400", dot: "bg-yellow-400" };
    return { label: "OK", cor: "text-green-400", dot: "bg-green-400" };
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex gap-2 flex-wrap">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="🔍 Buscar produto..."
            className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-[#6b6b6b] outline-none focus:border-[#E8622A] w-52"
          />
          <select
            value={catFiltro}
            onChange={(e) => setCatFiltro(e.target.value)}
            className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#E8622A]"
          >
            <option value="todos">Todas categorias</option>
            {categorias.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.emoji} {c.nome}</option>
            ))}
          </select>
        </div>
        <button
          onClick={abrirNovo}
          className="bg-[#E8622A] hover:bg-[#d4531f] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
        >
          + Cadastrar Produto
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              {["Produto", "Categoria", "Un.", "Custo", "Venda", "Margem", "Estoque", "Status", ""].map((h) => (
                <th key={h} className="text-left text-[11px] text-[#6b6b6b] uppercase tracking-wider px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr><td colSpan={9} className="text-center text-[#6b6b6b] py-10">Carregando...</td></tr>
            )}
            {!carregando && produtos_filtrados.length === 0 && (
              <tr><td colSpan={9} className="text-center text-[#6b6b6b] py-10">Nenhum produto encontrado</td></tr>
            )}
            {produtos_filtrados.map((p) => {
              const st = statusEstoque(p);
              const pct = Math.min(100, (p.estoque_atual / Math.max(p.estoque_maximo, 1)) * 100);
              return (
                <tr key={p.id} className="border-b border-[#2a2a2a] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium text-white text-sm">{p.nome}</td>
                  <td className="px-4 py-3">
                    <span className="bg-[#E8622A]/15 text-[#E8622A] text-xs px-2 py-0.5 rounded-full font-medium">
                      {p.categoria_emoji} {p.categoria_nome ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6b6b6b] text-sm">{p.unidade}</td>
                  <td className="px-4 py-3 text-sm text-[#6b6b6b]">{fmt(p.custo)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-[#E8622A]">{fmt(p.preco_venda)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-400">{margem(p.custo, p.preco_venda)}%</td>
                  <td className="px-4 py-3 text-sm text-white">
                    {p.estoque_atual} {p.unidade}
                    <div className="h-1 bg-[#2a2a2a] rounded-full mt-1 w-20">
                      <div
                        className="h-1 rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: pct < 20 ? "#ff4757" : pct < 50 ? "#f5a623" : "#2ed573",
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`flex items-center gap-1.5 ${st.cor}`}>
                      <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => abrirEditar(p)}
                      className="text-xs bg-[#2a2a2a] hover:bg-[#333] text-white px-3 py-1.5 rounded-lg transition-all"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={(e) => e.target === e.currentTarget && setModal(false)}
        >
          <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl w-[480px] p-7">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-lg">{editId ? "Editar Produto" : "Cadastrar Produto"}</h2>
              <button onClick={() => setModal(false)} className="w-7 h-7 bg-[#2a2a2a] rounded-full text-sm text-[#6b6b6b] hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#6b6b6b] uppercase tracking-wide block mb-1">Nome *</label>
                  <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#E8622A]"
                    placeholder="Ex: Picanha" />
                </div>
                <div>
                  <label className="text-[11px] text-[#6b6b6b] uppercase tracking-wide block mb-1">Código de Barras</label>
                  <input value={form.codigo_barras} onChange={(e) => setForm({ ...form, codigo_barras: e.target.value })}
                    className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#E8622A]"
                    placeholder="7891234..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#6b6b6b] uppercase tracking-wide block mb-1">Categoria</label>
                  <select value={form.categoria_id ?? ""} onChange={(e) => setForm({ ...form, categoria_id: e.target.value || null })}
                    className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#E8622A]">
                    <option value="">Sem categoria</option>
                    {categorias.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#6b6b6b] uppercase tracking-wide block mb-1">Unidade *</label>
                  <select value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })}
                    className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#E8622A]">
                    {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#6b6b6b] uppercase tracking-wide block mb-1">Custo (R$) *</label>
                  <input type="number" value={form.custo} onChange={(e) => setForm({ ...form, custo: e.target.value })}
                    className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#E8622A]"
                    placeholder="0,00" />
                </div>
                <div>
                  <label className="text-[11px] text-[#6b6b6b] uppercase tracking-wide block mb-1">Preço Venda (R$) *</label>
                  <input type="number" value={form.preco_venda} onChange={(e) => setForm({ ...form, preco_venda: e.target.value })}
                    className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#E8622A]"
                    placeholder="0,00" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-[#6b6b6b] uppercase tracking-wide block mb-1">Estoque Atual</label>
                  <input type="number" value={form.estoque_atual} onChange={(e) => setForm({ ...form, estoque_atual: e.target.value })}
                    className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#E8622A]" />
                </div>
                <div>
                  <label className="text-[11px] text-[#6b6b6b] uppercase tracking-wide block mb-1">Mínimo</label>
                  <input type="number" value={form.estoque_minimo} onChange={(e) => setForm({ ...form, estoque_minimo: e.target.value })}
                    className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#E8622A]" />
                </div>
                <div>
                  <label className="text-[11px] text-[#6b6b6b] uppercase tracking-wide block mb-1">Máximo</label>
                  <input type="number" value={form.estoque_maximo} onChange={(e) => setForm({ ...form, estoque_maximo: e.target.value })}
                    className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#E8622A]" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(false)}
                className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-2.5 rounded-xl text-sm font-medium transition-all">
                Cancelar
              </button>
              <button onClick={salvar}
                className="flex-[2] bg-[#E8622A] hover:bg-[#d4531f] text-white py-2.5 rounded-xl text-sm font-semibold transition-all">
                {editId ? "Salvar Alterações" : "✅ Cadastrar Produto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}