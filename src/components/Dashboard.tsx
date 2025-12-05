import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { FaSearch, FaTrash, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { AnimatedIcon } from './AnimatedIcon';
import type { Transacao, Filtros } from '../config';

const COLORS = ['#00C853', '#E5C07B', '#00953D', '#B39553', '#69F0AE'];

interface DashboardProps {
  isDark: boolean;
  filtros: Filtros;
  setFiltros: (filtros: Filtros) => void;
  todasCategorias: string[];
  aplicarFiltros: () => void;
  limparFiltros: () => void;
  todasTransacoesParaGraficos: Transacao[];
  gastosPorDia: any[];
  transacoes: Transacao[];
  loading: boolean;
  totalTransacoes: number;
  paginaAtual: number;
  totalPaginas: number;
  itensPorPagina: number;
  setItensPorPagina: (value: number) => void;
  irParaPagina: (pagina: number) => void;
  handleExcluirTransacao: (id: number) => void;
}

export function Dashboard({
  isDark,
  filtros,
  setFiltros,
  todasCategorias,
  aplicarFiltros,
  limparFiltros,
  todasTransacoesParaGraficos,
  gastosPorDia,
  transacoes,
  loading,
  totalTransacoes,
  paginaAtual,
  totalPaginas,
  itensPorPagina,
  setItensPorPagina,
  irParaPagina,
  handleExcluirTransacao,
}: DashboardProps) {
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarData = (data: string) => {
    try {
      return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return data;
    }
  };

  // Dados para gráfico de pizza (top 5 categorias) - separa por tipo (entrada/saída)
  const topCategoriasSaidas = Object.entries(
    todasTransacoesParaGraficos
      .filter(t => t.tipo === 'saida')
      .reduce((acc: any, t) => {
        const categoria = t.categoria || 'outros';
        if (!acc[categoria]) acc[categoria] = 0;
        acc[categoria] += t.valor;
        return acc;
      }, {})
  )
    .map(([name, value]: [string, any]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  
  const topCategoriasEntradas = Object.entries(
    todasTransacoesParaGraficos
      .filter(t => t.tipo === 'entrada')
      .reduce((acc: any, t) => {
        const categoria = t.categoria || 'outros';
        if (!acc[categoria]) acc[categoria] = 0;
        acc[categoria] += t.valor;
        return acc;
      }, {})
  )
    .map(([name, value]: [string, any]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const totalEntradas = todasTransacoesParaGraficos
    .filter((t) => t.tipo === 'entrada')
    .reduce((sum, t) => sum + t.valor, 0);
  
  const totalSaidas = todasTransacoesParaGraficos
    .filter((t) => t.tipo === 'saida')
    .reduce((sum, t) => sum + t.valor, 0);
  
  const saldo = totalEntradas - totalSaidas;
  
  const totalCredito = todasTransacoesParaGraficos
    .filter((t) => t.metodo === 'credito')
    .reduce((sum, t) => sum + t.valor, 0);
  
  const totalDebito = todasTransacoesParaGraficos
    .filter((t) => t.metodo === 'debito')
    .reduce((sum, t) => sum + t.valor, 0);

  const statusFinanceiro = [
    { name: 'Entradas', value: totalEntradas, color: '#10b981' },
    { name: 'Saídas', value: totalSaidas, color: '#ef4444' },
  ];

  const creditoDebito = [
    { name: 'Crédito', value: totalCredito, color: '#3b82f6' },
    { name: 'Débito', value: totalDebito, color: '#8b5cf6' },
  ];

  return (
    <>
      {/* Filtros */}
      <div className={`rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <h2 className={`text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <AnimatedIcon>
            <FaSearch className={`${isDark ? 'text-slate-400' : 'text-slate-600'} w-4 h-4 sm:w-5 sm:h-5`} />
          </AnimatedIcon>
          Filtros
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Data Início</label>
            <input
              type="date"
              value={filtros.dataInicio || ''}
              onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value || undefined })}
              className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
            />
          </div>

          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Data Fim</label>
            <input
              type="date"
              value={filtros.dataFim || ''}
              onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value || undefined })}
              className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
            />
          </div>

          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Descrição</label>
            <input
              type="text"
              placeholder="Buscar por descrição..."
              value={filtros.descricao || ''}
              onChange={(e) => setFiltros({ ...filtros, descricao: e.target.value || undefined })}
              className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-500' : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'}`}
            />
          </div>

          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Categoria</label>
            <select
              value={filtros.categoria || ''}
              onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value || undefined })}
              className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
            >
              <option value="">Todas as categorias</option>
              {todasCategorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Valor Mínimo</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={filtros.valorMin || ''}
              onChange={(e) => setFiltros({ ...filtros, valorMin: e.target.value ? parseFloat(e.target.value) : undefined })}
              className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-500' : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'}`}
            />
          </div>

          <div>
            <label className={`block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Valor Máximo</label>
            <input
              type="number"
              step="0.01"
              placeholder="999999.99"
              value={filtros.valorMax || ''}
              onChange={(e) => setFiltros({ ...filtros, valorMax: e.target.value ? parseFloat(e.target.value) : undefined })}
              className={`w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-500' : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'}`}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-3 sm:mt-4">
          <motion.button
            onClick={aplicarFiltros}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-2 text-sm sm:text-base text-white rounded-lg transition-colors font-medium shadow-md ${isDark ? 'bg-primary-500 hover:bg-primary-600' : 'bg-primary-600 hover:bg-primary-700'}`}
          >
            Aplicar Filtros
          </motion.button>
          <motion.button
            onClick={limparFiltros}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-2 text-sm sm:text-base rounded-lg transition-colors font-medium shadow-md ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            Limpar Filtros
          </motion.button>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6 lg:mb-8">
        {/* Gráfico de Status Financeiro - Entradas vs Saídas */}
        <div className={`rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Status Financeiro</h3>
          <div className="w-full h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusFinanceiro}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => {
                    const { name, percent, value } = props;
                    return `${name}: ${formatarMoeda(value)} (${((percent || 0) * 100).toFixed(0)}%)`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusFinanceiro.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatarMoeda(value)}
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    border: isDark ? '1px solid #475569' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    color: isDark ? '#cbd5e1' : '#1e293b'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className={`mt-4 p-4 rounded-lg ${saldo >= 0 ? (isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200') : (isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200')}`}>
            <p className={`text-sm font-medium ${saldo >= 0 ? (isDark ? 'text-green-300' : 'text-green-700') : (isDark ? 'text-red-300' : 'text-red-700')}`}>
              <span className="flex items-center gap-2">
                {saldo >= 0 ? (
                  <>
                    <FaCheckCircle className="text-green-500" size={16} />
                    <span>Saldo Positivo</span>
                  </>
                ) : (
                  <>
                    <FaExclamationTriangle className="text-gold-dark" size={16} />
                    <span>Saldo Negativo</span>
                  </>
                )}
              </span>
            </p>
            <p className={`text-lg font-bold mt-1 ${saldo >= 0 ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
              Saldo: {formatarMoeda(saldo)}
            </p>
          </div>
        </div>

        {/* Gráfico Crédito vs Débito */}
        <div className={`rounded-xl shadow-sm p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Crédito vs Débito</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={creditoDebito}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => {
                  const { name, percent, value } = props;
                  return `${name}: ${formatarMoeda(value)} (${((percent || 0) * 100).toFixed(0)}%)`;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {creditoDebito.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatarMoeda(value)}
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  border: isDark ? '1px solid #475569' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: isDark ? '#cbd5e1' : '#1e293b'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de Linha - Entradas e Saídas por Dia */}
        <div className={`rounded-xl shadow-sm p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Fluxo Financeiro por Dia (Últimos 30 dias)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={gastosPorDia}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#475569' : '#e2e8f0'} />
              <XAxis 
                dataKey="data" 
                tick={{ fill: isDark ? '#cbd5e1' : '#64748b', fontSize: 12 }}
                tickFormatter={(value) => {
                  try {
                    const date = new Date(value);
                    return format(date, 'dd/MM', { locale: ptBR });
                  } catch {
                    return value;
                  }
                }}
              />
              <YAxis 
                tick={{ fill: isDark ? '#cbd5e1' : '#64748b', fontSize: 12 }}
                tickFormatter={(value) => {
                  if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
                  return `R$ ${value}`;
                }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  return [formatarMoeda(value), name];
                }}
                labelFormatter={(label) => {
                  try {
                    const date = new Date(label);
                    return format(date, "dd/MM/yyyy", { locale: ptBR });
                  } catch {
                    return label;
                  }
                }}
                contentStyle={{
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  border: isDark ? '1px solid #475569' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: isDark ? '#cbd5e1' : '#1e293b'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="entradas" 
                stroke="#00C853" 
                strokeWidth={2} 
                name="Entradas"
                dot={{ fill: '#00C853', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="saidas" 
                stroke="#E5C07B" 
                strokeWidth={2} 
                name="Saídas"
                dot={{ fill: '#E5C07B', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="saldo" 
                stroke={isDark ? '#E5C07B' : '#00C853'} 
                strokeWidth={2} 
                strokeDasharray="5 5"
                name="Saldo"
                dot={{ fill: isDark ? '#E5C07B' : '#00C853', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Pizza - Top Categorias de Saídas */}
        <div className={`rounded-xl shadow-sm p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Top 5 Categorias - Saídas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topCategoriasSaidas.length > 0 ? topCategoriasSaidas : [{ name: 'Nenhuma saída', value: 0 }]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => {
                  const { name, percent } = props;
                  if (percent === 0) return '';
                  return `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {topCategoriasSaidas.map((_, index) => (
                  <Cell key={`cell-saida-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatarMoeda(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Categorias de Entradas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de Pizza - Top Categorias de Entradas */}
        <div className={`rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Top 5 Categorias - Entradas</h3>
          <div className="w-full h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topCategoriasEntradas.length > 0 ? topCategoriasEntradas : [{ name: 'Nenhuma entrada', value: 0 }]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => {
                    const { name, percent } = props;
                    if (percent === 0) return '';
                    return `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {topCategoriasEntradas.map((_, index) => (
                    <Cell key={`cell-entrada-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatarMoeda(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className={`rounded-lg sm:rounded-xl shadow-sm border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className={`p-4 sm:p-6 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h2 className={`text-lg sm:text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Transações</h2>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Mostrando {transacoes.length} de {totalTransacoes} transação(ões)
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              {/* Seletor de itens por página */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <label className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Itens por página:</label>
                <select
                  value={itensPorPagina}
                  onChange={(e) => setItensPorPagina(Number(e.target.value))}
                  className={`px-2 sm:px-3 py-1.5 rounded-lg border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 flex-1 sm:flex-none ${isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                </select>
              </div>
              {totalPaginas > 1 && (
                <div className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Página {paginaAtual} de {totalPaginas}
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 sm:p-12 text-center">
            <div className={`inline-block animate-spin rounded-full h-8 w-8 border-b-2 ${isDark ? 'border-primary-400' : 'border-primary-600'}`}></div>
            <p className={`mt-4 text-sm sm:text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Carregando transações...</p>
          </div>
        ) : transacoes.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <p className={`text-sm sm:text-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Nenhuma transação encontrada</p>
          </div>
        ) : (
          <>
            {/* Versão Desktop: Tabela */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className={isDark ? 'bg-slate-700' : 'bg-slate-50'}>
                  <tr>
                    <th className={`px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      Data/Hora
                    </th>
                    <th className={`px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      Descrição
                    </th>
                    <th className={`px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      Tipo
                    </th>
                    <th className={`px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      Método
                    </th>
                    <th className={`px-4 lg:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      Categoria
                    </th>
                    <th className={`px-4 lg:px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      Valor
                    </th>
                    <th className={`px-4 lg:px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'bg-slate-800 divide-slate-700' : 'bg-white divide-slate-200'}`}>
                  {transacoes.map((transacao, index) => {
                    const chaveUnica = transacao.id 
                      ? `transacao-${transacao.id}` 
                      : `transacao-${transacao.telefone}-${transacao.dataHora}-${transacao.descricao}-${transacao.valor}-${index}`;
                    
                    return (
                      <tr key={chaveUnica} className={`transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                        <td className={`px-4 lg:px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {formatarData(transacao.dataHora)}
                        </td>
                        <td className={`px-4 lg:px-6 py-4 text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {transacao.descricao}
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transacao.tipo === 'entrada' 
                              ? isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                              : isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                          }`}>
                            {transacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transacao.metodo === 'credito'
                              ? isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                              : isDark ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {transacao.metodo === 'credito' ? 'Crédito' : 'Débito'}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-primary-900 text-primary-200' : 'bg-primary-100 text-primary-800'}`}>
                            {transacao.categoria || 'outros'}
                          </span>
                        </td>
                        <td className={`px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                          transacao.tipo === 'entrada'
                            ? isDark ? 'text-green-400' : 'text-green-600'
                            : isDark ? 'text-red-400' : 'text-red-600'
                        }`}>
                          {transacao.tipo === 'entrada' ? '+' : '-'}{formatarMoeda(transacao.valor)}
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-center">
                          {transacao.id && (
                            <motion.button
                              onClick={() => handleExcluirTransacao(transacao.id!)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className={`p-2 rounded-lg transition-colors ${
                                isDark 
                                  ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300' 
                                  : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                              }`}
                              title="Excluir transação"
                            >
                              <FaTrash size={16} />
                            </motion.button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Versão Mobile: Cards */}
            <div className={`md:hidden divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-200'}`}>
              {transacoes.map((transacao, index) => {
                const chaveUnica = transacao.id 
                  ? `transacao-${transacao.id}` 
                  : `transacao-${transacao.telefone}-${transacao.dataHora}-${transacao.descricao}-${transacao.valor}-${index}`;
                
                return (
                  <div key={chaveUnica} className={`p-4 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {transacao.descricao}
                        </p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {formatarData(transacao.dataHora)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <p className={`text-lg font-bold ${
                          transacao.tipo === 'entrada'
                            ? isDark ? 'text-green-400' : 'text-green-600'
                            : isDark ? 'text-red-400' : 'text-red-600'
                        }`}>
                          {transacao.tipo === 'entrada' ? '+' : '-'}{formatarMoeda(transacao.valor)}
                        </p>
                        {transacao.id && (
                          <motion.button
                            onClick={() => handleExcluirTransacao(transacao.id!)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark 
                                ? 'text-red-400 hover:bg-red-900/20' 
                                : 'text-red-600 hover:bg-red-50'
                            }`}
                            title="Excluir"
                          >
                            <FaTrash size={14} />
                          </motion.button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        transacao.tipo === 'entrada' 
                          ? isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                          : isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                      }`}>
                        {transacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        transacao.metodo === 'credito'
                          ? isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                          : isDark ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {transacao.metodo === 'credito' ? 'Crédito' : 'Débito'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-primary-900 text-primary-200' : 'bg-primary-100 text-primary-800'}`}>
                        {transacao.categoria || 'outros'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Controles de Paginação */}
            {(totalPaginas > 1 || totalTransacoes > 0) && (
              <div className={`p-6 border-t flex items-center justify-between flex-wrap gap-4 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Mostrando {((paginaAtual - 1) * itensPorPagina) + 1} a {Math.min(paginaAtual * itensPorPagina, totalTransacoes)} de {totalTransacoes} transações
                </div>
                {totalPaginas > 1 && (
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => irParaPagina(paginaAtual - 1)}
                      disabled={paginaAtual === 1}
                      whileHover={{ scale: paginaAtual > 1 ? 1.05 : 1 }}
                      whileTap={{ scale: paginaAtual > 1 ? 0.95 : 1 }}
                      className={`px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      Anterior
                    </motion.button>
                    
                    {/* Números das páginas */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                        let pageNum: number;
                        if (totalPaginas <= 5) {
                          pageNum = i + 1;
                        } else if (paginaAtual <= 3) {
                          pageNum = i + 1;
                        } else if (paginaAtual >= totalPaginas - 2) {
                          pageNum = totalPaginas - 4 + i;
                        } else {
                          pageNum = paginaAtual - 2 + i;
                        }
                        
                        return (
                          <motion.button
                            key={pageNum}
                            onClick={() => irParaPagina(pageNum)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                              paginaAtual === pageNum
                                ? isDark ? 'bg-primary-500 text-white' : 'bg-primary-600 text-white'
                                : isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {pageNum}
                          </motion.button>
                        );
                      })}
                    </div>

                    <motion.button
                      onClick={() => irParaPagina(paginaAtual + 1)}
                      disabled={paginaAtual === totalPaginas}
                      whileHover={{ scale: paginaAtual < totalPaginas ? 1.05 : 1 }}
                      whileTap={{ scale: paginaAtual < totalPaginas ? 0.95 : 1 }}
                      className={`px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      Próxima
                    </motion.button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

