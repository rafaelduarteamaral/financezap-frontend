import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { useToast } from './contexts/ToastContext';
import { Login } from './components/Login';
import { api } from './services/api';
import type { Transacao, Estatisticas, Filtros } from './config';
import { 
  FaChartLine, 
  FaCreditCard, 
  FaCalendarDay, 
  FaChartBar, 
  FaMoon,
  FaSun,
  FaExclamationTriangle,
  FaGift,
  FaHome,
  FaCalendar,
  FaTags,
  FaWallet,
  FaCog,
  FaChevronDown,
  FaSignOutAlt
} from 'react-icons/fa';
import { InstallPrompt } from './components/InstallPrompt';
import { ChatIAPopup } from './components/ChatIAPopup';
import { Agendamentos } from './components/Agendamentos';
import { Categorias } from './components/Categorias';
import { Carteiras } from './components/Carteiras';
import { Configuracoes } from './components/Configuracoes';
import { Avatar } from './components/Avatar';
import { Logo } from './components/Logo';
import { Dashboard } from './components/Dashboard';
import { AnimatedIcon } from './components/AnimatedIcon';
import { ToastContainer } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { motion } from 'framer-motion';


function App() {
  const { isAuthenticated, usuario, logout, loading: authLoading, token } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showSuccess, showError, confirm, toasts, closeToast, confirmOptions, isConfirmOpen, closeConfirm } = useToast();
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
  const [abaAtiva, setAbaAtiva] = useState<'dashboard' | 'agendamentos' | 'categorias' | 'carteiras'>('dashboard');
  const [configuracoesAberto, setConfiguracoesAberto] = useState(false);
  const [usuarioDropdownAberto, setUsuarioDropdownAberto] = useState(false);

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
    const confirmar = await confirm({
      title: 'Excluir Transação',
      message: `Tem certeza que deseja excluir a transação "${transacao?.descricao || 'esta transação'}"?\n\nValor: ${transacao?.tipo === 'entrada' ? '+' : '-'}${formatarMoeda(transacao?.valor || 0)}\n\nEsta ação não pode ser desfeita.`,
      type: 'danger',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      onConfirm: () => {},
    });

    if (!confirmar) {
      return;
    }

    try {
      setLoading(true);
      const resultado = await api.excluirTransacao(id);
      
      if (resultado.success) {
        console.log('✅ Transação excluída com sucesso');
        showSuccess('Transação excluída com sucesso!');
        // Recarrega os dados para atualizar a lista
        await carregarDados(paginaAtual);
      } else {
        showError('Erro ao excluir transação: ' + (resultado.error || 'Erro desconhecido'));
      }
    } catch (error: any) {
      console.error('❌ Erro ao excluir transação:', error);
      showError('Erro ao excluir transação: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  // Função para carregar dados (deve ser definida antes dos useEffect)
  const carregarDados = async (pagina: number = 1) => {
    if (!usuario || !token) {
      console.log('⚠️ Usuário ou token não encontrado, não é possível carregar dados', { usuario: !!usuario, token: !!token });
      return;
    }
    
    // Verifica se o token está no localStorage antes de fazer requisições
    const savedToken = localStorage.getItem('auth_token');
    if (!savedToken) {
      console.log('⚠️ Token não encontrado no localStorage');
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
      // Se for erro de autenticação específico, faz logout
      if (error.message?.includes('campo telefone não encontrado') || 
          error.message?.includes('login novamente') ||
          (error.message?.includes('Token inválido') && error.message?.includes('campo telefone'))) {
        console.log('🔐 Token inválido detectado, fazendo logout...');
        logout();
        // Não recarrega a página - apenas faz logout e mostra tela de login
      } else if (error.message?.includes('Sessão expirada')) {
        console.log('🔐 Sessão expirada, fazendo logout...');
        logout();
      }
      // Outros erros não fazem logout automático
    } finally {
      setLoading(false);
    }
  };

  // Fecha dropdown quando clica fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.usuario-dropdown-container')) {
        setUsuarioDropdownAberto(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Carrega dados quando o usuário faz login
  useEffect(() => {
    // Aguarda o loading do AuthContext terminar antes de fazer requisições
    if (authLoading) {
      return;
    }
    
    // Só carrega dados se realmente estiver autenticado E tiver usuário E token
    if (isAuthenticated && usuario && !authLoading) {
      console.log('✅ Usuário autenticado, carregando dados...');
      carregarDados(1);
    } else {
      console.log('⚠️ Usuário não autenticado ou ainda carregando:', { isAuthenticated, usuario: !!usuario, authLoading });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, usuario, authLoading]);

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

  // Busca todas as categorias disponíveis (padrão + personalizadas) da API
  useEffect(() => {
    const buscarCategorias = async () => {
      if (!usuario) return;
      try {
        // Busca categorias da API (inclui categorias padrão e personalizadas)
        const response = await api.buscarCategorias();
        if (response.success && response.categorias) {
          const nomesCategorias = response.categorias.map((cat: any) => cat.nome);
          // Garante que 'outros' está sempre presente
          const categoriasCompletas = ['outros', ...nomesCategorias.filter((cat: string) => cat !== 'outros')];
          setTodasCategorias(categoriasCompletas);
        } else {
          // Fallback: extrai das transações se a API falhar
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
        }
      } catch (error) {
        console.error('❌ Erro ao buscar categorias:', error);
        // Fallback: usa categorias padrão se houver erro
        setTodasCategorias(['outros', 'alimentacao', 'transporte', 'moradia', 'saude', 'educacao', 'lazer', 'compras']);
      }
    };
    buscarCategorias();
  }, [usuario]);

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
              Seu período de trial de 7 dias expirou. Para continuar usando o Zela, assine um plano.
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

  const aplicarFiltros = () => {
    console.log('🔍 Aplicando filtros:', filtros);
    const pagina = 1; // Sempre volta para a primeira página ao aplicar filtros
    setPaginaAtual(pagina);
    // Recarrega os dados imediatamente
    if (usuario) {
      console.log('🔄 Recarregando dados após aplicar filtros...');
      carregarDados(pagina);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Prompt de Instalação PWA */}
      <InstallPrompt />
      
      {/* Header - Estilo Moderno com Verde Lima */}
      <header className="bg-primary-500 shadow-lg">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo à esquerda */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Logo size={32} className="sm:w-10 sm:h-10 lg:w-12 lg:h-12" />
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-white">Zela</h1>
            </div>

            {/* Navegação centralizada */}
            <nav className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-1 justify-center overflow-x-auto scrollbar-hide">
              <motion.button
                onClick={() => setAbaAtiva('dashboard')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 sm:px-4 lg:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 flex-shrink-0 ${
                  abaAtiva === 'dashboard'
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <FaHome size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Home</span>
              </motion.button>

              <motion.button
                onClick={() => setAbaAtiva('agendamentos')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 sm:px-4 lg:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 flex-shrink-0 ${
                  abaAtiva === 'agendamentos'
                    ? 'bg-white text-[hsl(220,15%,20%)] shadow-md'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <FaCalendar size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Agendamentos</span>
                <span className="sm:hidden">Agenda</span>
              </motion.button>

              <motion.button
                onClick={() => setAbaAtiva('categorias')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 sm:px-4 lg:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 flex-shrink-0 ${
                  abaAtiva === 'categorias'
                    ? 'bg-white text-[hsl(220,15%,20%)] shadow-md'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <FaTags size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Categorias</span>
                <span className="sm:hidden">Cats</span>
              </motion.button>

              <motion.button
                onClick={() => setAbaAtiva('carteiras')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 sm:px-4 lg:px-5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 flex-shrink-0 ${
                  abaAtiva === 'carteiras'
                    ? 'bg-white text-[hsl(220,15%,20%)] shadow-md'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <FaWallet size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Carteiras</span>
                <span className="sm:hidden">Carteira</span>
              </motion.button>
            </nav>

            {/* Seção do usuário à direita */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Botão Dark/Light Mode */}
              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-lg transition-colors flex-shrink-0 text-white hover:bg-white/10"
                title={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
              >
                {isDark ? (
                  <FaSun size={16} className="sm:w-5 sm:h-5" />
                ) : (
                  <FaMoon size={16} className="sm:w-5 sm:h-5" />
                )}
              </motion.button>

              {/* Dropdown do Usuário */}
              <div className="relative usuario-dropdown-container">
                <motion.button
                  onClick={() => {
                    setUsuarioDropdownAberto(!usuarioDropdownAberto);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 text-white hover:bg-white/10 rounded-lg px-2 py-1.5 transition-colors"
                >
                  <Avatar 
                    nome={usuario?.nome} 
                    telefone={usuario?.telefone} 
                    size={28}
                    className="cursor-pointer sm:w-8 sm:h-8"
                  />
                  {usuario && (
                    <div className="hidden sm:block text-left">
                      <div className="text-xs font-medium text-white">
                        {usuario.nome || formatarNumero(usuario.telefone)}
                      </div>
                      {usuario.status === 'premium' && (
                        <div className="text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded mt-0.5 inline-block">
                          Premium
                        </div>
                      )}
                    </div>
                  )}
                  <FaChevronDown size={12} className="hidden sm:block" />
                </motion.button>

                {/* Dropdown Menu do Usuário */}
                {usuarioDropdownAberto && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 rounded-lg shadow-xl border z-50 bg-white border-slate-200"
                  >
                    <div className="p-2">
                      <div className="px-3 py-2 border-b border-slate-200">
                        <div className="text-sm font-medium text-slate-900">
                          {usuario?.nome || formatarNumero(usuario?.telefone || '')}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {formatarNumero(usuario?.telefone || '')}
                        </div>
                      </div>
                      
                      <motion.button
                        onClick={() => {
                          setUsuarioDropdownAberto(false);
                          setConfiguracoesAberto(true);
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full px-3 py-2.5 rounded-lg text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <FaCog size={14} />
                        <span>Configurações</span>
                      </motion.button>
                      
                      <motion.button
                        onClick={() => {
                          setUsuarioDropdownAberto(false);
                          logout();
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full px-3 py-2.5 rounded-lg text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 mt-1"
                      >
                        <FaSignOutAlt size={14} />
                        <span>Sair</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Banner de Trial */}
      {usuario && usuario.status === 'trial' && usuario.diasRestantesTrial !== null && usuario.diasRestantesTrial !== undefined && (
        <div className={`max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pt-2 sm:pt-4 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg p-3 sm:p-4 border-2 ${
              usuario.diasRestantesTrial <= 3
                ? isDark ? 'border-amber-600 bg-amber-900/20' : 'border-amber-400 bg-amber-50'
                : isDark ? 'border-primary-600 bg-primary-900/20' : 'border-primary-500 bg-mint-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 flex-1">
                <div className="flex-shrink-0">
                  {usuario.diasRestantesTrial <= 3 ? (
                    <FaExclamationTriangle 
                      className={isDark ? 'text-amber-400' : 'text-amber-600'} 
                      size={14} 
                    />
                  ) : (
                    <FaGift 
                      className={isDark ? 'text-green-400' : 'text-green-600'} 
                      size={14} 
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm sm:text-base font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {usuario.diasRestantesTrial <= 3
                      ? `Seu trial expira em ${usuario.diasRestantesTrial} ${usuario.diasRestantesTrial === 1 ? 'dia' : 'dias'}!`
                      : `Trial ativo: ${usuario.diasRestantesTrial} ${usuario.diasRestantesTrial === 1 ? 'dia restante' : 'dias restantes'}`
                    }
                  </p>
                  <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
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
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gold-dark hover:bg-gold text-white rounded-lg font-medium text-xs sm:text-sm transition-colors w-full sm:w-auto flex-shrink-0"
                >
                  Assinar Agora
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <main className={`max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-6 lg:py-8 ${isDark ? 'bg-slate-900' : 'bg-white'} min-h-screen`}>
        {/* Cards de Estatísticas */}
        {estatisticas && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className={`rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 lg:p-6 border hover:shadow-md transition-shadow ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-[hsl(120,10%,96%)] border-slate-200'}`}
            >
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <p className={`text-xs sm:text-sm font-medium truncate pr-1 ${isDark ? 'text-slate-400' : 'text-[hsl(220,10%,50%)]'}`}>Total Gasto</p>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AnimatedIcon delay={0.1}>
                    <FaChartLine className="text-primary-500 w-3 h-3 sm:w-4 sm:h-4" />
                  </AnimatedIcon>
                </div>
              </div>
              <p className={`text-base sm:text-xl lg:text-2xl xl:text-3xl font-bold truncate ${isDark ? 'text-white' : 'text-[hsl(220,15%,20%)]'}`}>
                {formatarMoeda(estatisticas.totalGasto)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className={`rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 lg:p-6 border hover:shadow-md transition-shadow ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-[hsl(120,10%,96%)] border-slate-200'}`}
            >
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <p className={`text-xs sm:text-sm font-medium truncate pr-1 ${isDark ? 'text-slate-400' : 'text-[hsl(220,10%,50%)]'}`}>Total Transações</p>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gold-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AnimatedIcon delay={0.2}>
                    <FaCreditCard className="text-gold-600 w-3 h-3 sm:w-4 sm:h-4" />
                  </AnimatedIcon>
                </div>
              </div>
              <p className={`text-base sm:text-xl lg:text-2xl xl:text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {estatisticas.totalTransacoes}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className={`rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 lg:p-6 border hover:shadow-md transition-shadow ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-[hsl(120,10%,96%)] border-slate-200'}`}
            >
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <p className={`text-xs sm:text-sm font-medium truncate pr-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Gasto Hoje</p>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AnimatedIcon delay={0.3}>
                    <FaCalendarDay className="text-primary-600 w-3 h-3 sm:w-4 sm:h-4" />
                  </AnimatedIcon>
                </div>
              </div>
              <p className={`text-base sm:text-xl lg:text-2xl xl:text-3xl font-bold truncate ${isDark ? 'text-white' : 'text-[hsl(220,15%,20%)]'}`}>
                {formatarMoeda(estatisticas.gastoHoje)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className={`rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 lg:p-6 border hover:shadow-md transition-shadow ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-[hsl(120,10%,96%)] border-slate-200'}`}
            >
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <p className={`text-xs sm:text-sm font-medium truncate pr-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Média por Transação</p>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gold-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AnimatedIcon delay={0.4}>
                    <FaChartBar className="text-gold-600 w-3 h-3 sm:w-4 sm:h-4" />
                  </AnimatedIcon>
                </div>
              </div>
              <p className={`text-base sm:text-xl lg:text-2xl xl:text-3xl font-bold truncate ${isDark ? 'text-white' : 'text-[hsl(220,15%,20%)]'}`}>
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
        ) : abaAtiva === 'carteiras' ? (
          <Carteiras isDark={isDark} />
        ) : (
          <Dashboard
            isDark={isDark}
            filtros={filtros}
            setFiltros={setFiltros}
            todasCategorias={todasCategorias}
            aplicarFiltros={aplicarFiltros}
            limparFiltros={limparFiltros}
            todasTransacoesParaGraficos={todasTransacoesParaGraficos}
            gastosPorDia={gastosPorDia}
            transacoes={transacoes}
            loading={loading}
            totalTransacoes={totalTransacoes}
            paginaAtual={paginaAtual}
            totalPaginas={totalPaginas}
            itensPorPagina={itensPorPagina}
            setItensPorPagina={setItensPorPagina}
            irParaPagina={irParaPagina}
            handleExcluirTransacao={handleExcluirTransacao}
          />
        )}

        {/* Chat de IA - Agora é um popup flutuante */}
        <ChatIAPopup isDark={isDark} />
        
        {/* Modal de Configurações */}
        <Configuracoes 
          isOpen={configuracoesAberto} 
          onClose={() => setConfiguracoesAberto(false)} 
        />
      </main>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={closeToast} isDark={isDark} />
      
      {/* Confirm Dialog */}
      <ConfirmDialog 
        isOpen={isConfirmOpen} 
        options={confirmOptions} 
        onClose={closeConfirm} 
        isDark={isDark} 
      />
    </div>
  );
}

export default App;
