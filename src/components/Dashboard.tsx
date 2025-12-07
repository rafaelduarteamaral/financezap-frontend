import { useState } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, addMonths, subMonths, startOfDay, endOfDay } from 'date-fns';
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
import { FaSearch, FaTrash, FaCheckCircle, FaExclamationTriangle, FaCalendarAlt, FaArrowLeft, FaArrowRight, FaFilter, FaSync, FaChartLine, FaArrowUp, FaArrowDown, FaPlus } from 'react-icons/fa';
import { AnimatedIcon } from './AnimatedIcon';
import type { Transacao, Filtros } from '../config';
import { capitalize } from '../utils/capitalize';
import { ModalFormularioTransacao } from './ModalFormularioTransacao';

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
  const [periodoSelecionado, setPeriodoSelecionado] = useState<Date>(new Date());
  const [filtroRapidoAtivo, setFiltroRapidoAtivo] = useState<'hoje' | '7dias' | 'mes' | 'ano' | null>(null);
  const [cardsExpandidos, setCardsExpandidos] = useState<{ [key: string]: boolean }>({
    saldoAnterior: false,
    receitas: false,
    despesas: false,
    saldoPrevisto: false,
  });
  const [modalTransacaoAberto, setModalTransacaoAberto] = useState(false);

  const toggleCard = (card: string) => {
    setCardsExpandidos(prev => ({
      ...prev,
      [card]: !prev[card]
    }));
  };

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
    .map(([name, value]: [string, any]) => ({ name: capitalize(name), value }))
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
    .map(([name, value]: [string, any]) => ({ name: capitalize(name), value }))
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

  // Funções para filtros rápidos
  const aplicarFiltroRapido = (tipo: 'hoje' | '7dias' | 'mes' | 'ano') => {
    const hoje = new Date();
    let dataInicio: Date;
    let dataFim: Date = endOfDay(hoje);

    switch (tipo) {
      case 'hoje':
        dataInicio = startOfDay(hoje);
        break;
      case '7dias':
        dataInicio = startOfDay(subDays(hoje, 7));
        break;
      case 'mes':
        dataInicio = startOfMonth(hoje);
        dataFim = endOfMonth(hoje);
        break;
      case 'ano':
        dataInicio = startOfYear(hoje);
        dataFim = endOfYear(hoje);
        break;
    }

    const novosFiltros = {
      ...filtros,
      dataInicio: format(dataInicio, 'yyyy-MM-dd'),
      dataFim: format(dataFim, 'yyyy-MM-dd'),
    };
    setFiltros(novosFiltros);
    setPeriodoSelecionado(hoje);
    setFiltroRapidoAtivo(tipo);
    // Aplicar os filtros automaticamente
    setTimeout(() => aplicarFiltros(), 100);
  };

  const navegarMes = (direcao: 'anterior' | 'proximo') => {
    const novoPeriodo = direcao === 'anterior' 
      ? subMonths(periodoSelecionado, 1)
      : addMonths(periodoSelecionado, 1);
    setPeriodoSelecionado(novoPeriodo);
    
    const inicioMes = startOfMonth(novoPeriodo);
    const fimMes = endOfMonth(novoPeriodo);
    
    const novosFiltros = {
      ...filtros,
      dataInicio: format(inicioMes, 'yyyy-MM-dd'),
      dataFim: format(fimMes, 'yyyy-MM-dd'),
    };
    setFiltros(novosFiltros);
    setFiltroRapidoAtivo(null); // Limpar seleção de filtro rápido ao navegar mês
    // Aplicar os filtros automaticamente
    setTimeout(() => aplicarFiltros(), 100);
  };

  // Cálculos para os cards de resumo - aplicando filtros de data
  const transacoesFiltradas = todasTransacoesParaGraficos.filter((t) => {
    if (filtros.dataInicio || filtros.dataFim) {
      const dataTransacao = new Date(t.dataHora);
      const dataInicio = filtros.dataInicio ? new Date(filtros.dataInicio) : null;
      const dataFim = filtros.dataFim ? new Date(filtros.dataFim + 'T23:59:59') : null;
      
      if (dataInicio && dataTransacao < dataInicio) return false;
      if (dataFim && dataTransacao > dataFim) return false;
    }
    return true;
  });

  const receitas = transacoesFiltradas
    .filter(t => t.tipo === 'entrada')
    .reduce((sum, t) => sum + t.valor, 0);
  const despesas = transacoesFiltradas
    .filter(t => t.tipo === 'saida')
    .reduce((sum, t) => sum + t.valor, 0);
  const saldoPrevisto = receitas - despesas;
  
  // Calcular saldo anterior (período antes do filtro de data início)
  const saldoAnterior = (() => {
    if (!filtros.dataInicio) return 0;
    const dataInicio = new Date(filtros.dataInicio);
    const transacoesAnteriores = todasTransacoesParaGraficos.filter((t) => {
      const dataTransacao = new Date(t.dataHora);
      return dataTransacao < dataInicio;
    });
    const entradasAnteriores = transacoesAnteriores
      .filter(t => t.tipo === 'entrada')
      .reduce((sum, t) => sum + t.valor, 0);
    const saidasAnteriores = transacoesAnteriores
      .filter(t => t.tipo === 'saida')
      .reduce((sum, t) => sum + t.valor, 0);
    return entradasAnteriores - saidasAnteriores;
  })();

  const formatarPeriodo = () => {
    if (filtros.dataInicio && filtros.dataFim) {
      const inicio = new Date(filtros.dataInicio);
      const fim = new Date(filtros.dataFim);
      if (format(inicio, 'dd/MM/yyyy') === format(fim, 'dd/MM/yyyy')) {
        return format(inicio, 'dd \'De\' MMMM', { locale: ptBR });
      }
      return `${format(inicio, 'dd \'De\' MMMM', { locale: ptBR })} - ${format(fim, 'dd \'De\' MMMM', { locale: ptBR })}`;
    }
    return format(periodoSelecionado, 'MMMM', { locale: ptBR });
  };

  return (
    <>
      {/* Novos Filtros */}
      <div className={`rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-[hsl(120,10%,96%)] border-slate-200'}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'}`}
            >
              <FaCalendarAlt size={16} />
              Data De Vencimento
            </motion.button>
            
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navegarMes('anterior')}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
              >
                <FaArrowLeft className={isDark ? 'text-slate-300' : 'text-slate-700'} size={16} />
              </motion.button>
              
              <span className={`text-base font-semibold min-w-[120px] text-center ${isDark ? 'text-white' : 'text-[hsl(220,15%,20%)]'}`}>
                {format(periodoSelecionado, 'MMMM', { locale: ptBR })}
              </span>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navegarMes('proximo')}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
              >
                <FaArrowRight className={isDark ? 'text-slate-300' : 'text-slate-700'} size={16} />
              </motion.button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => aplicarFiltroRapido('hoje')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filtroRapidoAtivo === 'hoje'
                  ? isDark ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'
                  : isDark ? 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-300' : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-300'
              }`}
            >
              Hoje
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => aplicarFiltroRapido('7dias')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filtroRapidoAtivo === '7dias'
                  ? isDark ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'
                  : isDark ? 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-300' : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-300'
              }`}
            >
              7 Dias Atrás
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => aplicarFiltroRapido('mes')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filtroRapidoAtivo === 'mes'
                  ? isDark ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'
                  : isDark ? 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-300' : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-300'
              }`}
            >
              Esse Mês
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => aplicarFiltroRapido('ano')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filtroRapidoAtivo === 'ano'
                  ? isDark ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'
                  : isDark ? 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-300' : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-300'
              }`}
            >
              Esse Ano
            </motion.button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {filtros.dataInicio && filtros.dataFim 
                ? `${format(new Date(filtros.dataInicio), 'dd/MM')} - ${format(new Date(filtros.dataFim), 'dd/MM')}`
                : format(new Date(), 'dd/MM - dd/MM')
              }
            </span>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                limparFiltros();
                setFiltroRapidoAtivo(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
            >
              <FaFilter size={14} />
              Limpar Filtro
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={aplicarFiltros}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-primary-500 hover:bg-primary-600 text-white' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
            >
              <FaSync size={14} />
              Atualizar
            </motion.button>
          </div>
        </div>
      </div>

      {/* Cards de Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6 lg:mb-8">
        {/* Saldo Do Periodo Anterior */}
        <div className={`rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-[hsl(120,10%,96%)] border-slate-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FaChartLine className={isDark ? 'text-primary-400' : 'text-primary-500'} size={20} />
              <h3 className={`text-sm sm:text-base font-semibold ${isDark ? 'text-white' : 'text-[hsl(220,15%,20%)]'}`}>Saldo Do Periodo Anterior</h3>
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-bold mb-2 ${isDark ? 'text-primary-400' : 'text-primary-500'}`}>
            {formatarMoeda(saldoAnterior)}
          </p>
          <p className={`text-xs sm:text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-[hsl(220,10%,50%)]'}`}>
            Até {format(subDays(new Date(filtros.dataInicio ? new Date(filtros.dataInicio) : new Date()), 1), 'dd \'De\' MMMM', { locale: ptBR })}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleCard('saldoAnterior')}
            className={`w-full text-xs sm:text-sm font-medium py-2 rounded-lg ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          >
            {cardsExpandidos.saldoAnterior ? 'Ocultar Detalhes' : 'Mostrar Detalhes'}
          </motion.button>
          {cardsExpandidos.saldoAnterior && (
            <div className="mt-3 space-y-2">
              <div className={`flex justify-between items-center p-2 rounded ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                <span className={`text-xs sm:text-sm ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>Pendências</span>
                <span className={`text-sm font-semibold ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>R$ 0,00</span>
              </div>
              <div className={`flex justify-between items-center p-2 rounded ${isDark ? 'bg-primary-900/20' : 'bg-primary-50'}`}>
                <span className={`text-xs sm:text-sm ${isDark ? 'text-primary-300' : 'text-primary-700'}`}>Disponível</span>
                <span className={`text-sm font-semibold ${isDark ? 'text-primary-300' : 'text-primary-700'}`}>R$ 0,00</span>
              </div>
            </div>
          )}
        </div>

        {/* Receitas */}
        <div className={`rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-[hsl(120,10%,96%)] border-slate-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FaArrowUp className={isDark ? 'text-green-400' : 'text-green-600'} size={20} />
              <h3 className={`text-sm sm:text-base font-semibold ${isDark ? 'text-white' : 'text-[hsl(220,15%,20%)]'}`}>Receitas</h3>
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-bold mb-2 ${isDark ? 'text-primary-400' : 'text-primary-500'}`}>
            {formatarMoeda(receitas)}
          </p>
          <p className={`text-xs sm:text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-[hsl(220,10%,50%)]'}`}>
            {formatarPeriodo()}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleCard('receitas')}
            className={`w-full text-xs sm:text-sm font-medium py-2 rounded-lg ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          >
            {cardsExpandidos.receitas ? 'Ocultar Detalhes' : 'Mostrar Detalhes'}
          </motion.button>
          {cardsExpandidos.receitas && (
            <div className="mt-3 space-y-2">
              <div className={`flex justify-between items-center p-2 rounded ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
                <span className={`text-xs sm:text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>Recebido</span>
                <span className={`text-sm font-semibold ${isDark ? 'text-green-300' : 'text-green-700'}`}>{formatarMoeda(receitas)}</span>
              </div>
              <div className={`flex justify-between items-center p-2 rounded ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                <span className={`text-xs sm:text-sm ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>A Receber</span>
                <span className={`text-sm font-semibold ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>R$ 0,00</span>
              </div>
            </div>
          )}
        </div>

        {/* Despesas */}
        <div className={`rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-[hsl(120,10%,96%)] border-slate-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FaArrowDown className={isDark ? 'text-red-400' : 'text-red-600'} size={20} />
              <h3 className={`text-sm sm:text-base font-semibold ${isDark ? 'text-white' : 'text-[hsl(220,15%,20%)]'}`}>Despesas</h3>
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-bold mb-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            {formatarMoeda(despesas)}
          </p>
          <p className={`text-xs sm:text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-[hsl(220,10%,50%)]'}`}>
            {formatarPeriodo()}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleCard('despesas')}
            className={`w-full text-xs sm:text-sm font-medium py-2 rounded-lg ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          >
            {cardsExpandidos.despesas ? 'Ocultar Detalhes' : 'Mostrar Detalhes'}
          </motion.button>
          {cardsExpandidos.despesas && (
            <div className="mt-3 space-y-2">
              <div className={`flex justify-between items-center p-2 rounded ${isDark ? 'bg-primary-900/20' : 'bg-primary-50'}`}>
                <span className={`text-xs sm:text-sm ${isDark ? 'text-primary-300' : 'text-primary-700'}`}>Pago</span>
                <span className={`text-sm font-semibold ${isDark ? 'text-primary-300' : 'text-primary-700'}`}>{formatarMoeda(despesas)}</span>
              </div>
              <div className={`flex justify-between items-center p-2 rounded ${isDark ? 'bg-orange-900/20' : 'bg-orange-50'}`}>
                <span className={`text-xs sm:text-sm ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>A Pagar</span>
                <span className={`text-sm font-semibold ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>R$ 0,00</span>
              </div>
            </div>
          )}
        </div>

        {/* Saldo Previsto */}
        <div className={`rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-[hsl(120,10%,96%)] border-slate-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FaChartLine className={isDark ? 'text-primary-400' : 'text-primary-500'} size={20} />
              <h3 className={`text-sm sm:text-base font-semibold ${isDark ? 'text-white' : 'text-[hsl(220,15%,20%)]'}`}>Saldo Previsto</h3>
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-bold mb-2 ${saldoPrevisto >= 0 ? (isDark ? 'text-primary-400' : 'text-primary-500') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
            {formatarMoeda(saldoPrevisto)}
          </p>
          <p className={`text-xs sm:text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-[hsl(220,10%,50%)]'}`}>
            Até {format(new Date(filtros.dataFim || new Date()), 'dd \'De\' MMMM', { locale: ptBR })}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleCard('saldoPrevisto')}
            className={`w-full text-xs sm:text-sm font-medium py-2 rounded-lg ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          >
            {cardsExpandidos.saldoPrevisto ? 'Ocultar Detalhes' : 'Mostrar Detalhes'}
          </motion.button>
          {cardsExpandidos.saldoPrevisto && (
            <div className="mt-3 space-y-2">
              <div className={`flex justify-between items-center p-2 rounded ${saldoPrevisto >= 0 ? (isDark ? 'bg-red-900/20' : 'bg-red-50') : (isDark ? 'bg-red-900/20' : 'bg-red-50')}`}>
                <span className={`text-xs sm:text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>Disponível</span>
                <span className={`text-sm font-semibold ${isDark ? 'text-red-300' : 'text-red-700'}`}>{formatarMoeda(saldoPrevisto)}</span>
              </div>
              <div className={`flex justify-between items-center p-2 rounded ${isDark ? 'bg-primary-900/20' : 'bg-primary-50'}`}>
                <span className={`text-xs sm:text-sm ${isDark ? 'text-primary-300' : 'text-primary-700'}`}>Previsto</span>
                <span className={`text-sm font-semibold ${isDark ? 'text-primary-300' : 'text-primary-700'}`}>{formatarMoeda(saldoPrevisto)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filtros Avançados (mantidos para compatibilidade) */}
      <div className={`rounded-lg sm:rounded-xl shadow-sm p-2.5 sm:p-4 lg:p-6 mb-3 sm:mb-4 lg:mb-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <h2 className={`text-sm sm:text-lg lg:text-xl font-semibold mb-2 sm:mb-3 lg:mb-4 flex items-center gap-1.5 sm:gap-2 ${isDark ? 'text-white' : 'text-[hsl(220,15%,20%)]'}`}>
          <AnimatedIcon>
            <FaSearch className={`${isDark ? 'text-slate-400' : 'text-[hsl(220,10%,50%)]'} w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5`} />
          </AnimatedIcon>
          Filtros Avançados
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          <div>
            <label className={`block text-[10px] sm:text-xs lg:text-sm font-medium mb-1 sm:mb-1.5 lg:mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Data Início</label>
            <input
              type="date"
              value={filtros.dataInicio || ''}
              onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value || undefined })}
              className={`w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 text-xs sm:text-sm lg:text-base border rounded-md sm:rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
              style={isDark ? {} : { colorScheme: 'light' }}
            />
          </div>

          <div>
            <label className={`block text-[10px] sm:text-xs lg:text-sm font-medium mb-1 sm:mb-1.5 lg:mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Data Fim</label>
            <input
              type="date"
              value={filtros.dataFim || ''}
              onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value || undefined })}
              className={`w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 text-xs sm:text-sm lg:text-base border rounded-md sm:rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
              style={isDark ? {} : { colorScheme: 'light' }}
            />
          </div>

          <div>
            <label className={`block text-[10px] sm:text-xs lg:text-sm font-medium mb-1 sm:mb-1.5 lg:mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Descrição</label>
            <input
              type="text"
              placeholder="Buscar..."
              value={filtros.descricao || ''}
              onChange={(e) => setFiltros({ ...filtros, descricao: e.target.value || undefined })}
              className={`w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 text-xs sm:text-sm lg:text-base border rounded-md sm:rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-500' : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'}`}
            />
          </div>

          <div>
            <label className={`block text-[10px] sm:text-xs lg:text-sm font-medium mb-1 sm:mb-1.5 lg:mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Categoria</label>
            <select
              value={filtros.categoria || ''}
              onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value || undefined })}
              className={`w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 text-xs sm:text-sm lg:text-base border rounded-md sm:rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
            >
              <option value="">Todas</option>
              {todasCategorias.map((cat) => (
                <option key={cat} value={cat}>
                  {capitalize(cat)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 mt-2.5 sm:mt-3 lg:mt-4">
          <div>
            <label className={`block text-[10px] sm:text-xs lg:text-sm font-medium mb-1 sm:mb-1.5 lg:mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Valor Mínimo</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={filtros.valorMin || ''}
              onChange={(e) => setFiltros({ ...filtros, valorMin: e.target.value ? parseFloat(e.target.value) : undefined })}
              className={`w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 text-xs sm:text-sm lg:text-base border rounded-md sm:rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-500' : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'}`}
            />
          </div>

          <div>
            <label className={`block text-[10px] sm:text-xs lg:text-sm font-medium mb-1 sm:mb-1.5 lg:mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Valor Máximo</label>
            <input
              type="number"
              step="0.01"
              placeholder="999999.99"
              value={filtros.valorMax || ''}
              onChange={(e) => setFiltros({ ...filtros, valorMax: e.target.value ? parseFloat(e.target.value) : undefined })}
              className={`w-full px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-2.5 text-xs sm:text-sm lg:text-base border rounded-md sm:rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-500' : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'}`}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-2.5 sm:mt-3 lg:mt-4">
          <motion.button
            onClick={aplicarFiltros}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 sm:flex-none px-3 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-2 text-xs sm:text-sm lg:text-base text-white rounded-md sm:rounded-lg transition-colors font-medium shadow-md ${isDark ? 'bg-primary-500 hover:bg-primary-600' : 'bg-primary-600 hover:bg-primary-700'}`}
          >
            Aplicar Filtros
          </motion.button>
          <motion.button
            onClick={limparFiltros}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex-1 sm:flex-none px-3 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-2 text-xs sm:text-sm lg:text-base rounded-md sm:rounded-lg transition-colors font-medium shadow-md ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            Limpar Filtros
          </motion.button>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6 lg:mb-8">
        {/* Gráfico de Status Financeiro - Entradas vs Saídas */}
        <div className={`rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-[hsl(120,10%,96%)] border-slate-200'}`}>
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
                    const { percent } = props;
                    if (percent === 0) return '';
                    return `${((percent || 0) * 100).toFixed(0)}%`;
                  }}
                  outerRadius={75}
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
                  const { percent } = props;
                  if (percent === 0) return '';
                  return `${((percent || 0) * 100).toFixed(0)}%`;
                }}
                outerRadius={75}
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
                data={topCategoriasSaidas.length > 0 ? topCategoriasSaidas : [{ name: 'Nenhuma Saída', value: 0 }]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => {
                  const { percent } = props;
                  if (percent === 0) return '';
                  return `${((percent || 0) * 100).toFixed(0)}%`;
                }}
                outerRadius={75}
                fill="#8884d8"
                dataKey="value"
              >
                {topCategoriasSaidas.map((_, index) => (
                  <Cell key={`cell-saida-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string) => [formatarMoeda(value), capitalize(name)]}
              />
              <Legend formatter={(value: string) => capitalize(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Categorias de Entradas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de Pizza - Top Categorias de Entradas */}
        <div className={`rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-[hsl(120,10%,96%)] border-slate-200'}`}>
          <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Top 5 Categorias - Entradas</h3>
          <div className="w-full h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topCategoriasEntradas.length > 0 ? topCategoriasEntradas : [{ name: 'Nenhuma Entrada', value: 0 }]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => {
                    const { percent } = props;
                    if (percent === 0) return '';
                    return `${((percent || 0) * 100).toFixed(0)}%`;
                  }}
                  outerRadius={75}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {topCategoriasEntradas.map((_, index) => (
                    <Cell key={`cell-entrada-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string) => [formatarMoeda(value), capitalize(name)]}
                />
                <Legend formatter={(value: string) => capitalize(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className={`rounded-lg sm:rounded-xl shadow-sm border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className={`p-4 sm:p-6 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <h2 className={`text-lg sm:text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Transações</h2>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Mostrando {transacoes.length} de {totalTransacoes} transação(ões)
              </p>
            </div>
            <motion.button
              onClick={() => setModalTransacaoAberto(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white ${
                isDark ? 'bg-primary-500 hover:bg-primary-600' : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              <FaPlus size={14} />
              Nova Transação
            </motion.button>
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
                          {capitalize(transacao.descricao)}
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
                              ? isDark ? 'bg-primary-900 text-primary-200' : 'bg-primary-100 text-primary-800'
                              : isDark ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {transacao.metodo === 'credito' ? 'Crédito' : 'Débito'}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-primary-900 text-primary-200' : 'bg-primary-100 text-primary-800'}`}>
                            {capitalize(transacao.categoria || 'outros')}
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
                          {capitalize(transacao.descricao)}
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
                              ? isDark ? 'bg-primary-900 text-primary-200' : 'bg-primary-100 text-primary-800'
                          : isDark ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {transacao.metodo === 'credito' ? 'Crédito' : 'Débito'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-primary-900 text-primary-200' : 'bg-primary-100 text-primary-800'}`}>
                        {capitalize(transacao.categoria || 'outros')}
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

      {/* Modal de Nova Transação */}
      <ModalFormularioTransacao
        isOpen={modalTransacaoAberto}
        onClose={() => setModalTransacaoAberto(false)}
        onSuccess={async () => {
          console.log('🔄 onSuccess chamado após criar transação');
          
          // Aguarda um pouco para o backend processar
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Limpa TODOS os filtros e recarrega os dados
          console.log('🔄 Limpando filtros e recarregando dados após criar transação...');
          limparFiltros();
        }}
        isDark={isDark}
        categorias={todasCategorias}
      />
    </>
  );
}

