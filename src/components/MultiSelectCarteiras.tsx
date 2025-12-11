import { useState, useRef, useEffect } from 'react';

interface Carteira {
  id: number;
  nome: string;
  tipo?: string;
}

interface MultiSelectCarteirasProps {
  carteiras: Carteira[];
  selectedIds: number[];
  onChange: (selectedIds: number[]) => void;
  isDark: boolean;
}

export function MultiSelectCarteiras({
  carteiras,
  selectedIds,
  onChange,
  isDark,
}: MultiSelectCarteirasProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown quando clica fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtra carteiras baseado no termo de busca
  const filteredCarteiras = carteiras.filter((carteira) =>
    carteira.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleCarteira = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedCarteiras = carteiras.filter((c) => selectedIds.includes(c.id));

  // Se não houver carteiras, mostra mensagem
  if (carteiras.length === 0) {
    return (
      <div
        className={`w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 text-xs sm:text-sm lg:text-base border rounded-md sm:rounded-lg ${
          isDark
            ? 'border-slate-600 bg-slate-700 text-slate-400'
            : 'border-slate-300 bg-slate-50 text-slate-500'
        }`}
      >
        Nenhuma carteira disponível
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Campo de entrada */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 text-xs sm:text-sm lg:text-base border rounded-md sm:rounded-lg cursor-pointer focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[42px] flex items-center justify-between ${
          isDark
            ? 'border-slate-600 bg-slate-700 text-white'
            : 'border-slate-300 bg-white text-slate-900'
        }`}
      >
        <div className="flex-1 flex flex-wrap gap-1">
          {selectedCarteiras.length === 0 ? (
            <span
              className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}
            >
              Selecione as carteiras...
            </span>
          ) : (
            selectedCarteiras.map((carteira) => (
              <span
                key={carteira.id}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                  isDark
                    ? 'bg-primary-600 text-white'
                    : 'bg-primary-100 text-primary-800'
                }`}
              >
                {carteira.nome}
                {carteira.tipo && (
                  <span className="text-[10px] opacity-75">
                    ({carteira.tipo === 'credito' ? 'Crédito' : 'Débito'})
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCarteira(carteira.id);
                  }}
                  className="ml-1 hover:opacity-75"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`absolute z-50 w-full mt-1 rounded-md sm:rounded-lg shadow-lg border ${
            isDark
              ? 'border-slate-600 bg-slate-700'
              : 'border-slate-300 bg-white'
          } max-h-60 overflow-hidden`}
        >
          {/* Campo de busca */}
          <div className="p-2 border-b border-slate-600">
            <input
              type="text"
              placeholder="Buscar carteiras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className={`w-full px-2 py-1.5 text-xs sm:text-sm rounded border focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                isDark
                  ? 'border-slate-600 bg-slate-800 text-white placeholder-slate-400'
                  : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Lista de carteiras */}
          <div className="max-h-48 overflow-y-auto">
            {filteredCarteiras.length === 0 ? (
              <div
                className={`px-4 py-3 text-sm text-center ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Nenhuma carteira encontrada
              </div>
            ) : (
              filteredCarteiras.map((carteira) => {
                const isSelected = selectedIds.includes(carteira.id);
                return (
                  <label
                    key={carteira.id}
                    className={`flex items-center px-4 py-2 cursor-pointer hover:bg-opacity-50 ${
                      isDark
                        ? isSelected
                          ? 'bg-primary-600 bg-opacity-30 hover:bg-primary-600 hover:bg-opacity-40'
                          : 'hover:bg-slate-600'
                        : isSelected
                        ? 'bg-primary-50 hover:bg-primary-100'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCarteira(carteira.id)}
                      className={`mr-3 w-4 h-4 rounded border-2 cursor-pointer ${
                        isDark
                          ? 'border-slate-500 bg-slate-800 text-primary-500'
                          : 'border-slate-300 bg-white text-primary-600'
                      } focus:ring-2 focus:ring-primary-500`}
                    />
                    <div className="flex-1">
                      <div
                        className={`text-sm font-medium ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {carteira.nome}
                      </div>
                      {carteira.tipo && (
                        <div
                          className={`text-xs ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          {carteira.tipo === 'credito' ? 'Crédito' : 'Débito'}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
