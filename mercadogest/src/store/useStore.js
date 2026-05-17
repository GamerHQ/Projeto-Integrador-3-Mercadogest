import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export const useStore = create((set, get) => ({
  // ── Estado ──────────────────────────────────────
  pagina: "pdv",
  produtos: [],
  categorias: [],
  kpis: null,
  grafico: [],
  topProdutos: [],
  pagamentos: [],
  lancamentos: [],
  vendas: [],
  carregando: false,
  erro: null,

  // ── Navegacao ────────────────────────────────────
  setPagina: (pagina) => set({ pagina }),

  // ── Helpers ──────────────────────────────────────
  setCarregando: (v) => set({ carregando: v }),
  setErro: (e) => set({ erro: e }),

  // ── Produtos ─────────────────────────────────────
  carregarProdutos: async () => {
    set({ carregando: true, erro: null });
    try {
      const produtos = await invoke("listar_produtos");
      set({ produtos });
    } catch (e) {
      set({ erro: String(e) });
    } finally {
      set({ carregando: false });
    }
  },

  carregarCategorias: async () => {
    try {
      const categorias = await invoke("listar_categorias");
      set({ categorias });
    } catch (e) {
      console.error("Erro ao carregar categorias:", e);
    }
  },

  criarProduto: async (produto) => {
    await invoke("criar_produto", { produto });
    await get().carregarProdutos();
  },

  atualizarProduto: async (id, produto) => {
    await invoke("atualizar_produto", { id, produto });
    await get().carregarProdutos();
  },

  excluirProduto: async (id) => {
    await invoke("excluir_produto", { id });
    await get().carregarProdutos();
  },

  atualizarEstoque: async (id, estoqueAtual) => {
    await invoke("atualizar_estoque", { 
      id: Number(id), 
      estoqueAtual: Number(estoqueAtual) 
    });
    await get().carregarProdutos(); 
  },

  // ── Vendas / PDV ─────────────────────────────────
  registrarVenda: async (venda) => {
    const id = await invoke("registrar_venda", { venda });
    await get().carregarProdutos();
    return id;
  },

  carregarVendas: async () => {
    set({ carregando: true });
    try {
      const vendas = await invoke("listar_vendas", { limite: 50 });
      set({ vendas });
    } catch (e) {
      set({ erro: String(e) });
    } finally {
      set({ carregando: false });
    }
  },

  // ── Financeiro ────────────────────────────────────
  carregarLancamentos: async () => {
    set({ carregando: true });
    try {
      const lancamentos = await invoke("listar_lancamentos", { limite: 50 });
      set({ lancamentos });
    } catch (e) {
      set({ erro: String(e) });
    } finally {
      set({ carregando: false });
    }
  },

  criarLancamento: async (lancamento) => {
    await invoke("criar_lancamento", { lancamento });
    await get().carregarLancamentos();
    await get().carregarKpis();
  },

  // ── Dashboard ─────────────────────────────────────
  carregarKpis: async () => {
    try {
      const kpis = await invoke("buscar_kpis_dashboard");
      set({ kpis });
    } catch (e) {
      console.error("Erro ao carregar KPIs:", e);
    }
  },

  carregarGrafico: async () => {
    try {
      const grafico = await invoke("grafico_7_dias");
      set({ grafico });
    } catch (e) {
      console.error("Erro ao carregar grafico:", e);
    }
  },

  carregarRelatorios: async () => {
    set({ carregando: true });
    try {
      const [topProdutos, pagamentos, vendas] = await Promise.all([
        invoke("top_produtos", { limite: 5 }),
        invoke("pagamentos_por_tipo"),
        invoke("listar_vendas", { limite: 10 }),
      ]);
      set({ topProdutos, pagamentos, vendas });
    } catch (e) {
      set({ erro: String(e) });
    } finally {
      set({ carregando: false });
    }
  },
}));