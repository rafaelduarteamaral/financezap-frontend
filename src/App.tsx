import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { Login } from './components/Login';
import { api } from './services/api';
import type { Transacao, Estatisticas, Filtros } from './config';
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
import { 
  FaChartLine, 
  FaCreditCard, 
  FaCalendarDay, 
  FaChartBar, 
  FaSearch,
  FaMoneyBillWave,
  FaMoon,
  FaSun,
  FaExclamationTriangle,
  FaGift,
  FaCheckCircle,
  FaTrash
} from 'react-icons/fa';
import { AnimatedIcon } from './components/AnimatedIcon';
import { ChatIAPopup } from './components/ChatIAPopup';
import { Agendamentos } from './components/Agendamentos';
import { Categorias } from './components/Categorias';
import { Configuracoes } from './components/Configuracoes';
import { Avatar } from './components/Avatar';
import { motion } from 'framer-motion';

const COLORS = ['#00C853', '#E5C07B', '#00953D', '#B39553', '#69F0AE']; // Verde Brand e Dourado com variações

function App() {
  const { isAuthenticated, usuario, logout, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [gastosPorDia, setGastosPorDia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<Filtros>({});
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalTransacoes, setTotalTransacoes] = useState(0);
  const [itensPorPagina, setItensPorPagina] = useState(5);
  const [todasCategorias, setTodasCategorias] = useState<string[]>([]);
  // Dados separados para gráficos (todas as transações, sem paginação)
  const [todasTransacoesParaGraficos, setTodasTransacoesParaGraficos] = useState<Transacao[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<'dashboard' | 'agendamentos' | 'categorias'>('dashboard');
  const [configuracoesAberto, setConfiguracoesAberto] = useState(false);

  // Função para remover duplicatas de transações
  const removerDuplicatas = (transacoes: Transacao[]): Transacao[] => {
    const visto = new Map<string, Transacao>();
    
    for (const transacao of transacoes) {
      // Cria uma chave única baseada em ID ou combinação de campos
      let chave: string;
      
      if (transacao.id) {
        // Se tem ID, usa o ID como chave
        chave = `id-${transacao.id}`;
      } else {
        // Se não tem ID, usa combinação de campos únicos
        chave = `${transacao.telefone}-${transacao.dataHora}-${transacao.descricao}-${transacao.valor}`;
      }
      
      // Só adiciona se ainda não viu essa chave
      if (!visto.has(chave)) {
        visto.set(chave, transacao);
      } else {
        console.log(`⚠️ Duplicata detectada e removida:`, {
          id: transacao.id,
          descricao: transacao.descricao,
          dataHora: transacao.dataHora,
          valor: transacao.valor
        });
      }
    }
    
    return Array.from(visto.values());
  };

  // Função para excluir transação
  const handleExcluirTransacao = async (id: number) => {
    // Confirmação antes de excluir
    const transacao = transacoes.find(t => t.id === id);
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir a transação "${transacao?.descricao || 'esta transação'}"?\n\n` +
      `Valor: ${transacao?.tipo === 'entrada' ? '+' : '-'}${formatarMoeda(transacao?.valor || 0)}\n\n` +
      `Esta ação não pode ser desfeita.`
    );

    if (!confirmar) {
      return;
    }

    try {
      setLoading(true);
      const resultado = await api.excluirTransacao(id);
      
      if (resultado.success) {
        console.log('✅ Transação excluída com sucesso');
        // Recarrega os dados para atualizar a lista
        await carregarDados(paginaAtual);
      } else {
        alert('Erro ao excluir transação: ' + (resultado.error || 'Erro desconhecido'));
      }
    } catch (error: any) {
      console.error('❌ Erro ao excluir transação:', error);
      alert('Erro ao excluir transação: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  // Função para carregar dados (deve ser definida antes dos useEffect)
  const carregarDados = async (pagina: number = 1) => {
    if (!usuario) {
      console.log('⚠️ Usuário não encontrado, não é possível carregar dados');
      return;
    }
    
    console.log('🔄 Carregando dados para usuário:', usuario.telefone);
    setLoading(true);
    try {
      // Usa paginação - o backend já filtra pelo telefone do token JWT
      console.log('📡 Fazendo requisições para API...');
      // Carrega dados paginados para a tabela
      const [transacoesData, statsData, gastosData, todasTransacoesData] = await Promise.all([
        api.buscarTransacoes({ ...filtros, page: pagina, limit: itensPorPagina }),
        api.buscarEstatisticas(filtros),
        api.buscarGastosPorDia(30),
        // Carrega TODAS as transações (sem paginação) para os gráficos
        api.buscarTransacoes({ ...filtros, page: 1, limit: 10000 }),
      ]);

      console.log('📥 Resposta transações:', transacoesData);
      console.log('📥 Resposta estatísticas:', statsData);
      console.log('📥 Resposta gastos por dia:', gastosData);

      if (transacoesData.success) {
        const total = transacoesData.total || 0;
        const totalPages = transacoesData.totalPages || 1;
        const currentPage = transacoesData.page || 1;
        const transacoesCount = transacoesData.transacoes?.length || 0;
        
        console.log(`✅ Transações carregadas: ${transacoesCount} de ${total} total`);
        console.log(`   📄 Página ${currentPage} de ${totalPages}`);
        console.log(`   📊 Paginação:`, {
          page: currentPage,
          limit: transacoesData.limit,
          total,
          totalPages,
          hasNextPage: transacoesData.hasNextPage,
          hasPrevPage: transacoesData.hasPrevPage
        });
        
        // Remove duplicatas baseadas em ID ou combinação única de campos
        const transacoesUnicas = removerDuplicatas(transacoesData.transacoes || []);
        console.log(`🔍 Transações após remoção de duplicatas: ${transacoesUnicas.length} (removidas ${transacoesCount - transacoesUnicas.length})`);
        
        setTransacoes(transacoesUnicas);
        setTotalTransacoes(total);
        setTotalPaginas(totalPages);
        // Só atualiza a página atual se for diferente (evita loops)
        if (currentPage !== paginaAtual) {
          setPaginaAtual(currentPage);
        }
      } else {
        console.error('❌ Erro ao carregar transações:', transacoesData.error);
      }
      
      if (statsData.success) {
        console.log('✅ Estatísticas carregadas:', statsData.estatisticas);
        setEstatisticas(statsData.estatisticas);
      } else {
        console.error('❌ Erro ao carregar estatísticas:', statsData.error);
      }
      
      if (gastosData.success) {
        console.log('✅ Gastos por dia carregados:', gastosData.dados?.length || 0);
        setGastosPorDia(gastosData.dados?.reverse() || []);
      } else {
        console.error('❌ Erro ao carregar gastos por dia:', gastosData.error);
      }
      
      // Salva todas as transações para os gráficos (sem paginação)
      if (todasTransacoesData.success) {
        const todasTransacoesUnicas = removerDuplicatas(todasTransacoesData.transacoes || []);
        console.log(`✅ Todas as transações para gráficos: ${todasTransacoesUnicas.length} (após remoção de duplicatas)`);
        setTodasTransacoesParaGraficos(todasTransacoesUnicas);
      } else {
        console.error('❌ Erro ao carregar todas as transações:', todasTransacoesData.error);
        setTodasTransacoesParaGraficos([]);
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar dados:', error);
      // Se for erro de autenticação, faz logout
      if (error.message?.includes('Sessão expirada') || error.message?.includes('Token')) {
        console.log('🔐 Token inválido, fazendo logout...');
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  // TODOS os hooks devem ser chamados ANTES de qualquer return condicional
  // Carrega dados quando o usuário faz login
  useEffect(() => {
    if (isAuthenticated && usuario) {
      carregarDados(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, usuario]);

  // Carrega dados quando muda itens por página (volta para página 1)
  useEffect(() => {
    if (isAuthenticated && usuario) {
      setPaginaAtual(1);
      carregarDados(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itensPorPagina]);

  // Carrega dados quando muda a página
  useEffect(() => {
    if (isAuthenticated && usuario && paginaAtual > 0) {
      carregarDados(paginaAtual);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaAtual]);

  // Busca todas as categorias únicas do usuário (usa todas as transações para gráficos)
  useEffect(() => {
    const buscarCategorias = async () => {
      if (!usuario) return;
      try {
        // Usa as transações já carregadas para gráficos, ou busca se necessário
        if (todasTransacoesParaGraficos.length > 0) {
          const categoriasUnicas = Array.from(
            new Set(todasTransacoesParaGraficos.map((t: Transacao) => t.categoria || 'outros'))
          ).sort();
          setTodasCategorias(categoriasUnicas);
        } else {
          // Se ainda não carregou, busca todas as transações
          const data = await api.buscarTransacoes({ ...filtros, page: 1, limit: 10000 });
          if (data.success && data.transacoes) {
            const categoriasUnicas: string[] = Array.from(
              new Set(data.transacoes.map((t: Transacao) => t.categoria || 'outros'))
            ).sort() as string[];
            setTodasCategorias(categoriasUnicas);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao buscar categorias:', error);
      }
    };
    buscarCategorias();
  }, [usuario, todasTransacoesParaGraficos, filtros]);

  // Agora sim, podemos fazer returns condicionais
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // Bloqueia acesso se trial expirou
  if (usuario && usuario.status === 'expirado' && (!usuario.diasRestantesTrial || usuario.diasRestantesTrial <= 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`max-w-md w-full rounded-xl shadow-2xl p-8 ${
            isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
          }`}
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
              <FaExclamationTriangle className="text-red-600 dark:text-red-400" size={40} />
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Trial Expirado
            </h2>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Seu período de trial de 7 dias expirou. Para continuar usando o FinanceZap, assine um plano.
            </p>
          </div>

          <div className="space-y-4">
            <motion.button
              onClick={() => setConfiguracoesAberto(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
            >
              Ver Planos e Assinar
            </motion.button>
            <motion.button
              onClick={logout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-full py-3 rounded-lg font-medium ${
                isDark
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Sair
            </motion.button>
          </div>
        </motion.div>
        <Configuracoes isOpen={configuracoesAberto} onClose={() => setConfiguracoesAberto(false)} />
      </div>
    );
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarNumero = (numero: string) => {
    if (numero.startsWith('+55')) {
      const ddd = numero.substring(3, 5);
      const parte1 = numero.substring(5, 10);
      const parte2 = numero.substring(10);
      return `(${ddd}) ${parte1}-${parte2}`;
    }
    return numero;
  };

  const formatarData = (data: string) => {
    try {
      return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return data;
    }
  };

  const aplicarFiltros = () => {
    console.log('🔍 Aplicando filtros:', filtros);
    setPaginaAtual(1); // Volta para a primeira página ao aplicar filtros
    // Recarrega os dados imediatamente
    if (usuario) {
      carregarDados(1);
    }
  };

  const limparFiltros = () => {
    console.log('🧹 Limpando filtros');
    setFiltros({});
    setPaginaAtual(1);
    // Recarrega os dados imediatamente
    if (usuario) {
      carregarDados(1);
    }
  };

  const irParaPagina = (pagina: number) => {
    if (pagina >= 1 && pagina <= totalPaginas) {
      setPaginaAtual(pagina);
    }
  };

  // Dados para gráfico de pizza (top 5 categorias) - separa por tipo (entrada/saída)
  // Categorias de saídas
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
  
  // Categorias de entradas
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

  // Calcula entradas e saídas
  const totalEntradas = todasTransacoesParaGraficos
    .filter((t) => t.tipo === 'entrada')
    .reduce((sum, t) => sum + t.valor, 0);
  
  const totalSaidas = todasTransacoesParaGraficos
    .filter((t) => t.tipo === 'saida')
    .reduce((sum, t) => sum + t.valor, 0);
  
  const saldo = totalEntradas - totalSaidas;
  
  // Calcula crédito e débito
  const totalCredito = todasTransacoesParaGraficos
    .filter((t) => t.metodo === 'credito')
    .reduce((sum, t) => sum + t.valor, 0);
  
  const totalDebito = todasTransacoesParaGraficos
    .filter((t) => t.metodo === 'debito')
    .reduce((sum, t) => sum + t.valor, 0);

  // Status financeiro (para gráfico)
  const statusFinanceiro = [
    { name: 'Entradas', value: totalEntradas, color: '#10b981' },
    { name: 'Saídas', value: totalSaidas, color: '#ef4444' },
  ];

  // Dados para gráfico crédito vs débito
  const creditoDebito = [
    { name: 'Crédito', value: totalCredito, color: '#3b82f6' },
    { name: 'Débito', value: totalDebito, color: '#8b5cf6' },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme === 'dark' ? 'from-slate-900 to-slate-800' : 'from-slate-50 to-slate-100'}`}>
      {/* Header */}
      <header className={`shadow-sm border-b ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <AnimatedIcon size={32}>
                  <FaMoneyBillWave className="text-primary-500" />
                </AnimatedIcon>
                <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>FinanceZap</h1>
              </div>
              <p className={`mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Dashboard Administrativo Financeiro</p>
              
              {/* Abas de navegação */}
              <div className="flex gap-2 mt-4">
                <motion.button
                  onClick={() => setAbaAtiva('dashboard')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    abaAtiva === 'dashboard'
                      ? isDark
                        ? 'bg-primary-500 text-white'
                        : 'bg-primary-600 text-white'
                      : isDark
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Dashboard
                </motion.button>
                <motion.button
                  onClick={() => setAbaAtiva('agendamentos')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    abaAtiva === 'agendamentos'
                      ? isDark
                        ? 'bg-primary-500 text-white'
                        : 'bg-primary-600 text-white'
                      : isDark
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Agendamentos
                </motion.button>
                <motion.button
                  onClick={() => setAbaAtiva('categorias')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    abaAtiva === 'categorias'
                      ? isDark
                        ? 'bg-primary-500 text-white'
                        : 'bg-primary-600 text-white'
                      : isDark
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Categorias
                </motion.button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Botão Dark Mode */}
              <motion.button
                onClick={() => {
                  console.log('🔘 Botão clicado, tema atual:', theme);
                  toggleTheme();
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
              >
                {theme === 'light' ? <FaMoon size={20} /> : <FaSun size={20} />}
              </motion.button>
              
              {/* Botão de Configurações/Perfil */}
              <motion.button
                onClick={() => setConfiguracoesAberto(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full transition-all hover:ring-2 hover:ring-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                title="Configurações da conta"
              >
                <Avatar 
                  nome={usuario?.nome} 
                  telefone={usuario?.telefone} 
                  size={40}
                  className="cursor-pointer"
                />
              </motion.button>
              
              {usuario && (
                <div className="text-right">
                  <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Conectado como</div>
                  <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatarNumero(usuario.telefone)}
                  </div>
                </div>
              )}
              <motion.button
                onClick={logout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-lg transition-colors font-medium text-sm shadow-sm ${
                  isDark
                    ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30 border border-red-800'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                Sair
              </motion.button>
              <div className="text-right">
                <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Última atualização</div>
                <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Banner de Trial */}
      {usuario && usuario.status === 'trial' && usuario.diasRestantesTrial !== null && usuario.diasRestantesTrial !== undefined && (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4`}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg p-4 border-2 ${
              usuario.diasRestantesTrial <= 3
                ? 'border-amber-400 dark:border-amber-600'
                : 'border-green-500 dark:border-green-600'
            } bg-transparent`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  {usuario.diasRestantesTrial <= 3 ? (
                    <FaExclamationTriangle className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} size={16} />
                  ) : (
                    <FaGift className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} size={16} />
                  )}
                </div>
                <div>
                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {usuario.diasRestantesTrial <= 3
                      ? `Seu trial expira em ${usuario.diasRestantesTrial} ${usuario.diasRestantesTrial === 1 ? 'dia' : 'dias'}!`
                      : `Trial ativo: ${usuario.diasRestantesTrial} ${usuario.diasRestantesTrial === 1 ? 'dia restante' : 'dias restantes'}`
                    }
                  </p>
                  <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    {usuario.diasRestantesTrial <= 3
                      ? 'Assine um plano para continuar usando o sistema após o período de trial.'
                      : 'Após o período de trial, você precisará assinar um plano para continuar.'
                    }
                  </p>
                </div>
              </div>
              {usuario.diasRestantesTrial <= 3 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-gold-dark hover:bg-gold text-white rounded-lg font-medium text-sm transition-colors"
                >
                  Assinar Agora
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Estatísticas */}
        {estatisticas && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className={`rounded-xl shadow-sm p-6 border hover:shadow-md transition-shadow ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Total Gasto</p>
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <AnimatedIcon delay={0.1}>
                    <FaChartLine className="text-primary-600" size={16} />
                  </AnimatedIcon>
                </div>
              </div>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatarMoeda(estatisticas.totalGasto)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className={`rounded-xl shadow-sm p-6 border hover:shadow-md transition-shadow ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Total Transações</p>
                <div className="w-8 h-8 bg-gold-100 rounded-lg flex items-center justify-center">
                  <AnimatedIcon delay={0.2}>
                    <FaCreditCard className="text-gold-600" size={16} />
                  </AnimatedIcon>
                </div>
              </div>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {estatisticas.totalTransacoes}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className={`rounded-xl shadow-sm p-6 border hover:shadow-md transition-shadow ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Gasto Hoje</p>
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <AnimatedIcon delay={0.3}>
                    <FaCalendarDay className="text-primary-600" size={16} />
                  </AnimatedIcon>
                </div>
              </div>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatarMoeda(estatisticas.gastoHoje)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className={`rounded-xl shadow-sm p-6 border hover:shadow-md transition-shadow ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Média por Transação</p>
                <div className="w-8 h-8 bg-gold-100 rounded-lg flex items-center justify-center">
                  <AnimatedIcon delay={0.4}>
                    <FaChartBar className="text-gold-600" size={16} />
                  </AnimatedIcon>
                </div>
              </div>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatarMoeda(estatisticas.mediaGasto)}
              </p>
            </motion.div>
          </div>
        )}

        {/* Conteúdo baseado na aba ativa */}
        {abaAtiva === 'agendamentos' ? (
          <Agendamentos isDark={isDark} />
        ) : abaAtiva === 'categorias' ? (
          <Categorias isDark={isDark} />
        ) : (
          <>
            {/* Filtros */}
            <div className={`rounded-xl shadow-sm p-6 mb-8 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <AnimatedIcon>
              <FaSearch className={isDark ? 'text-slate-400' : 'text-slate-600'} size={20} />
            </AnimatedIcon>
            Filtros
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Data Início</label>
              <input
                type="date"
                value={filtros.dataInicio || ''}
                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value || undefined })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Data Fim</label>
              <input
                type="date"
                value={filtros.dataFim || ''}
                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value || undefined })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Descrição</label>
              <input
                type="text"
                placeholder="Buscar por descrição..."
                value={filtros.descricao || ''}
                onChange={(e) => setFiltros({ ...filtros, descricao: e.target.value || undefined })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-500' : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Categoria</label>
              <select
                value={filtros.categoria || ''}
                onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value || undefined })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Valor Mínimo</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={filtros.valorMin || ''}
                onChange={(e) => setFiltros({ ...filtros, valorMin: e.target.value ? parseFloat(e.target.value) : undefined })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-500' : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Valor Máximo</label>
              <input
                type="number"
                step="0.01"
                placeholder="999999.99"
                value={filtros.valorMax || ''}
                onChange={(e) => setFiltros({ ...filtros, valorMax: e.target.value ? parseFloat(e.target.value) : undefined })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-500' : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'}`}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <motion.button
              onClick={aplicarFiltros}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-2 text-white rounded-lg transition-colors font-medium shadow-md ${isDark ? 'bg-primary-500 hover:bg-primary-600' : 'bg-primary-600 hover:bg-primary-700'}`}
            >
              Aplicar Filtros
            </motion.button>
            <motion.button
              onClick={limparFiltros}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-2 rounded-lg transition-colors font-medium shadow-md ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
            >
              Limpar Filtros
            </motion.button>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gráfico de Status Financeiro - Entradas vs Saídas */}
          <div className={`rounded-xl shadow-sm p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Status Financeiro</h3>
            <ResponsiveContainer width="100%" height={300}>
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
          <div className={`rounded-xl shadow-sm p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Top 5 Categorias - Entradas</h3>
            <ResponsiveContainer width="100%" height={300}>
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

        {/* Lista de Transações */}
        <div className={`rounded-xl shadow-sm border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className={`p-6 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Transações</h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Mostrando {transacoes.length} de {totalTransacoes} transação(ões)
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* Seletor de itens por página */}
                <div className="flex items-center gap-2">
                  <label className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Itens por página:</label>
                  <select
                    value={itensPorPagina}
                    onChange={(e) => setItensPorPagina(Number(e.target.value))}
                    className={`px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'}`}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                  </select>
                </div>
                {totalPaginas > 1 && (
                  <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Página {paginaAtual} de {totalPaginas}
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className={`inline-block animate-spin rounded-full h-8 w-8 border-b-2 ${isDark ? 'border-primary-400' : 'border-primary-600'}`}></div>
              <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Carregando transações...</p>
            </div>
          ) : transacoes.length === 0 ? (
            <div className="p-12 text-center">
              <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDark ? 'bg-slate-700' : 'bg-slate-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      Data/Hora
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      Descrição
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      Tipo
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      Método
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      Categoria
                    </th>
                    <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      Valor
                    </th>
                    <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'bg-slate-800 divide-slate-700' : 'bg-white divide-slate-200'}`}>
                  {transacoes.map((transacao, index) => {
                    // Cria uma chave única: usa ID se disponível, senão usa combinação de campos
                    const chaveUnica = transacao.id 
                      ? `transacao-${transacao.id}` 
                      : `transacao-${transacao.telefone}-${transacao.dataHora}-${transacao.descricao}-${transacao.valor}-${index}`;
                    
                    return (
                    <tr key={chaveUnica} className={`transition-colors ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {formatarData(transacao.dataHora)}
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {transacao.descricao}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transacao.tipo === 'entrada' 
                            ? isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                            : isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                        }`}>
                          {transacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transacao.metodo === 'credito'
                            ? isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                            : isDark ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {transacao.metodo === 'credito' ? 'Crédito' : 'Débito'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-primary-900 text-primary-200' : 'bg-primary-100 text-primary-800'}`}>
                          {transacao.categoria || 'outros'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                        transacao.tipo === 'entrada'
                          ? isDark ? 'text-green-400' : 'text-green-600'
                          : isDark ? 'text-red-400' : 'text-red-600'
                      }`}>
                        {transacao.tipo === 'entrada' ? '+' : '-'}{formatarMoeda(transacao.valor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
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
          )}

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
        </div>
          </>
        )}

        {/* Chat de IA - Agora é um popup flutuante */}
        <ChatIAPopup isDark={isDark} />
        
        {/* Modal de Configurações */}
        <Configuracoes 
          isOpen={configuracoesAberto} 
          onClose={() => setConfiguracoesAberto(false)} 
        />
      </main>
    </div>
  );
}

export default App;
