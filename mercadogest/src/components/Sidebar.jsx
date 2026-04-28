import { useStore } from "../store/useStore";

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊'},
  { id: 'pdv', label: 'Frente de Caixa', icon: '🛒', badge: 'PDV'},
  { id: 'produtos', label: 'Produtos', icon: '📦'},
  { id: 'estoque', label: 'Controle de Estoque', icon: '🏷️'},
  { id: 'financeiro', label: 'Financeiro', icon: '💰'},
  { id: 'relatorios', label: 'Relatórios', icon: '📈'},
];

export function Sidebar() {
  const { pagina, setPagina } = useStore();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-[#161616] border-r border-[#2a2a2a] flex flex-col py-6 z-50">
      {/* Logo */}
      <div className="px-6 pb-6 border-b border-[#2a2a2a] mb-5">
        <div className="w-10 h-10 bg-[#e8622a] rounded-xl flex items-center justify-center text-xl mb-2">🥩</div>
        <h1 className="font-syne text-lg font-extrabold tracking-tight">MercadoGest</h1>
        <span className="text-[10px] text-[#6b6b6b] uppercase tracking-widest font-medium">Sistema de Gestão</span>
      </div>

      {/* Nav */}
<nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setPagina(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${
              pagina === item.id 
                ? 'bg-[#e8622a]/10 text-[#e8622a] font-bold' 
                : 'text-[#6b6b6b] hover:bg-[#2a2a2a] hover:text-white'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
            {item.badge && (
              <span className="ml-auto bg-[#e8622a] text-white text-[10px] px-2 py-0.5 rounded-md font-bold">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* User Footer */}
      <div className="mt-auto px-6 pt-4 border-t border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e8622a] to-[#f5a623] flex items-center justify-center font-bold text-xs">JO</div>
          <div>
            <p className="text-xs font-medium">Fulano</p>
            <p className="text-[10px] text-[#6b6b6b]">Administrador</p>
          </div>
        </div>
      </div>
    </aside>
  );
}