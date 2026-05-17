import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";

const fmt = (v) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const FORMAS = ["Dinheiro", "Cartão", "Pix"];

export function PDV() {
  const { produtos, carregarProdutos, registrarVenda } = useStore();
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState([]);
  const [forma, setForma] = useState("Dinheiro");
  const [desconto, setDesconto] = useState(0);
  const [finalizando, setFinalizando] = useState(false);
  const [sucesso, setSucesso] = useState(null);
  const [comprovante, setComprovante] = useState(null);

  useEffect(() => {
    carregarProdutos();
  }, []);

  const produtosFiltrados = produtos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const adicionar = (produto) => {
    setCarrinho((prev) => {
      const existe = prev.find((i) => i.produto_id === produto.id);
      if (existe) {
        return prev.map((i) =>
          i.produto_id === produto.id
            ? {
                ...i,
                quantidade: i.quantidade + 1,
                subtotal: (i.quantidade + 1) * i.preco_unit,
              }
            : i
        );
      }
      return [
        ...prev,
        {
          produto_id: produto.id,
          nome: produto.nome,
          quantidade: 1,
          preco_unit: produto.preco_venda,
          subtotal: produto.preco_venda,
        },
      ];
    });
  };

  const mudarQtd = (produto_id, delta) => {
    setCarrinho((prev) =>
      prev
        .map((i) =>
          i.produto_id === produto_id
            ? {
                ...i,
                quantidade: i.quantidade + delta,
                subtotal: (i.quantidade + delta) * i.preco_unit,
              }
            : i
        )
        .filter((i) => i.quantidade > 0)
    );
  };

  const subtotal = carrinho.reduce((s, i) => s + i.subtotal, 0);
  const total = Math.max(0, subtotal - Number(desconto));

  const gerarComprovante = (vendaId) => {
    const agora = new Date();
    const criado_em = `${String(agora.getDate()).padStart(2, "0")}/${String(
      agora.getMonth() + 1
    ).padStart(2, "0")}/${agora.getFullYear()} ${String(
      agora.getHours()
    ).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;

    return {
      venda_id: vendaId,
      criado_em,
      itens: carrinho.map(({ produto_id, nome, quantidade, preco_unit, subtotal }) => ({
        produto_id,
        nome,
        quantidade,
        preco_unit,
        subtotal,
      })),
      subtotal,
      desconto: Number(desconto),
      total,
      forma_pagamento: forma,
    };
  };

  const finalizar = async () => {
    if (carrinho.length === 0) return;

    setFinalizando(true);
    try {
      const id = await registrarVenda({
        itens: carrinho.map(({ produto_id, quantidade, preco_unit, subtotal }) => ({
          produto_id,
          quantidade,
          preco_unit,
          subtotal,
        })),
        total,
        desconto: Number(desconto),
        forma_pagamento: forma,
      });

      const novoComprovante = gerarComprovante(id);
      setComprovante(novoComprovante);
      setSucesso(id);

      // Pergunta após venda registrada
      const imprimir = window.confirm("Imprimir comprovante?");
      if (imprimir) {
        // Damos um pequeno delay para garantir que o componente do comprovante já renderezou no DOM
        setTimeout(() => window.print(), 100);
      }

      setCarrinho([]);
      setDesconto(0);
      setTimeout(() => setSucesso(null), 3000);
      
      // Oculta o comprovante da tela depois de um tempo para não ficar "poluindo" o HTML oculto
      setTimeout(() => setComprovante(null), 1000); 

    } catch (e) {
      alert("Erro ao finalizar venda: " + e);
    } finally {
      setFinalizando(false);
    }
  };

  return (
    <>
      {/* A classe "print:hidden" garante que NADA dessa tela escura apareça na impressora.
      */}
      <div className="print:hidden grid grid-cols-[1fr_360px] gap-5 h-[calc(100vh-140px)]">
        {/* Produtos */}
        <div className="flex flex-col gap-4">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="🔍  Buscar produto..."
            className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-[#6b6b6b] outline-none focus:border-[#E8622A]"
          />
          <div className="grid grid-cols-4 gap-3 overflow-y-auto pb-2">
            {produtosFiltrados.map((p) => (
              <button
                key={p.id}
                onClick={() => adicionar(p)}
                className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-3 text-center hover:border-[#E8622A] hover:bg-[#E8622A]/5 transition-all"
              >
                <div className="text-2xl mb-2">{p.categoria_emoji ?? "📦"}</div>
                <p className="text-xs font-medium text-white mb-1 leading-tight">{p.nome}</p>
                <p className="text-sm font-bold text-[#E8622A]">{fmt(p.preco_venda)}</p>
                <p className="text-[10px] text-[#6b6b6b]">
                  {p.estoque_atual} {p.unidade}
                </p>
              </button>
            ))}
            {produtosFiltrados.length === 0 && (
              <div className="col-span-4 text-center text-[#6b6b6b] py-12 text-sm">
                Nenhum produto encontrado
              </div>
            )}
          </div>
        </div>

        {/* Carrinho */}
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2a2a2a] flex justify-between items-center">
            <span className="font-bold text-base">🛒 Carrinho</span>
            <button
              onClick={() => setCarrinho([])}
              className="text-xs text-[#6b6b6b] hover:text-white bg-[#2a2a2a] px-3 py-1.5 rounded-lg"
            >
              Limpar
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {carrinho.length === 0 ? (
              <div className="text-center text-[#6b6b6b] py-12 text-sm">
                <div className="text-3xl mb-2">🛒</div>
                Clique nos produtos para adicionar
              </div>
            ) : (
              carrinho.map((item) => (
                <div
                  key={item.produto_id}
                  className="bg-[#161616] rounded-xl p-3 flex items-center gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.nome}</p>
                    <p className="text-xs text-[#6b6b6b]">{fmt(item.preco_unit)} / un</p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#2a2a2a] rounded-lg px-2 py-1 text-xs">
                    <button
                      onClick={() => mudarQtd(item.produto_id, -1)}
                      className="text-[#6b6b6b] hover:text-white w-4"
                    >
                      −
                    </button>
                    <span className="font-bold text-white w-5 text-center">
                      {item.quantidade}
                    </span>
                    <button
                      onClick={() => mudarQtd(item.produto_id, +1)}
                      className="text-[#6b6b6b] hover:text-white w-4"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm font-bold text-white min-w-[64px] text-right">
                    {fmt(item.subtotal)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#2a2a2a] bg-[#161616] space-y-3">
            <div className="flex justify-between text-sm text-[#6b6b6b]">
              <span>Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between text-sm text-[#6b6b6b]">
              <span>Desconto (R$)</span>
              <input
                type="number"
                min="0"
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
                className="w-24 bg-[#2a2a2a] border border-[#333] rounded-lg px-2 py-1 text-white text-sm text-right outline-none focus:border-[#E8622A]"
              />
            </div>

            <div className="flex justify-between font-extrabold text-xl text-white">
              <span>Total</span>
              <span>{fmt(total)}</span>
            </div>

            {/* Forma de pagamento */}
            <div className="grid grid-cols-3 gap-2">
              {FORMAS.map((f) => (
                <button
                  key={f}
                  onClick={() => setForma(f)}
                  className={`py-2 rounded-lg text-xs font-medium transition-all ${
                    forma === f
                      ? "bg-[#E8622A]/15 border border-[#E8622A] text-[#E8622A]"
                      : "bg-[#2a2a2a] border border-[#333] text-[#6b6b6b] hover:text-white"
                  }`}
                >
                  {f === "Dinheiro" ? "💵" : f === "Cartão" ? "💳" : "📱"} {f}
                </button>
              ))}
            </div>

            {sucesso && (
              <div className="bg-green-900/30 border border-green-700/40 rounded-xl py-2 text-center text-green-400 text-sm font-medium">
                ✅ Venda #{sucesso} finalizada!
              </div>
            )}

            <button
              onClick={finalizar}
              disabled={carrinho.length === 0 || finalizando}
              className="w-full py-3.5 bg-[#E8622A] hover:bg-[#d4531f] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all text-base"
            >
              {finalizando ? "Registrando..." : "✅ Finalizar Venda"}
            </button>
          </div>
        </div>
      </div>

      {/* Comprovante */}
      {/* Mudança chave aqui: 
        hidden -> Ocupa espaço 0 na tela escura normal do sistema
        print:block -> Aparece na hora da impressão
        print:absolute print:left-0 print:top-0 -> Posiciona ele certinho na quina da bobina
        w-[80mm] -> Força a largura para impressora térmica
      */}
      {comprovante && (
        <div 
              id="cupom-fiscal"
              className="hidden print:block print:absolute print:left-0 print:top-0 w-[80mm] bg-white text-black p-2 font-mono">
          <div className="font-black text-base text-center">MERCADOGEST</div>
          <div className="text-[10px] mt-1 text-center">Venda: #{comprovante.venda_id} | Data: {comprovante.criado_em}</div>

          <div className="mt-2 border-t border-black border-dashed pt-2 space-y-1">
            {comprovante.itens.map((it) => (
              <div key={it.produto_id} className="flex justify-between text-xs">
                <span className="pr-2 truncate">{it.nome}</span>
                <span>
                  {it.quantidade}x {fmt(it.preco_unit)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-2 border-t border-black border-dashed pt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{fmt(comprovante.subtotal)}</span>
            </div>
            {comprovante.desconto > 0 && (
              <div className="flex justify-between">
                <span>Desconto</span>
                <span>{fmt(comprovante.desconto)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-base mt-1">
              <span>TOTAL</span>
              <span>{fmt(comprovante.total)}</span>
            </div>
            <div className="text-xs mt-2 border-t border-black pt-1">
              Pgto: <span className="font-bold">{comprovante.forma_pagamento}</span>
            </div>
          </div>
          
          <div className="text-[10px] text-center mt-6">
             Obrigado e volte sempre!
          </div>
        </div>
      )}
    </>
  );
}