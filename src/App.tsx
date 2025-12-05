import { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { useToast } from './contexts/ToastContext';
import { Login } from './components/Login';
import { api } from './services/api';
import type { Transacao, Estatisticas, Filtros } from './config';
import { API_BASE_URL } from './config';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FaChartLine, 
  FaCreditCard, 
  FaCalendarDay, 
  FaChartBar, 
  FaMoon,
  FaSun,
  FaExclamationTriangle,
  FaGift
} from 'react-icons/fa';
import { InstallPrompt } from './components/InstallPrompt';
import { ChatIAPopup } from './components/ChatIAPopup';
import { Agendamentos } from './components/Agendamentos';
import { Categorias } from './components/Categorias';
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

  // TODOS os hooks devem ser chamados ANTES de qualquer return condicional
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

  // Conexão SSE para atualizações em tempo real
  useEffect(() => {
    if (!isAuthenticated || !token || authLoading) {
      console.log('⚠️ SSE: Não conectando -', { isAuthenticated, hasToken: !!token, authLoading });
      return;
    }

    // Usa a mesma URL da API que o resto da aplicação (já importada no topo)
    console.log('🔌 SSE: Iniciando conexão para', `${API_BASE_URL}/api/events`);
    console.log('🔌 SSE: VITE_API_URL do env:', import.meta.env.VITE_API_URL);
    console.log('🔌 SSE: PROD mode:', import.meta.env.PROD);
    
    // Criar uma conexão fetch manual para SSE (EventSource não suporta headers customizados)
    let abortController: AbortController | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;
    let buffer = '';

    const connectSSE = async () => {
      try {
        abortController = new AbortController();
        
        console.log('📡 SSE: Tentando conectar...');
        const response = await fetch(`${API_BASE_URL}/api/events`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream',
          },
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ SSE: Erro na resposta:', response.status, errorText);
          throw new Error(`SSE connection failed: ${response.status} - ${errorText}`);
        }

        console.log('✅ SSE: Conexão estabelecida, status:', response.status);
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No reader available');
        }

        reconnectAttempts = 0; // Reset contador ao conectar
        buffer = ''; // Limpa buffer

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('📡 SSE: Conexão fechada pelo servidor');
            break;
          }

          // Decodifica e adiciona ao buffer
          buffer += decoder.decode(value, { stream: true });
          
          // Processa linhas completas
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Mantém última linha incompleta no buffer
          
          let currentEvent = '';
          let currentData = '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Ignora pings (keep-alive)
            if (trimmedLine === ': ping' || trimmedLine === 'ping' || trimmedLine.startsWith(': ')) {
              console.log('💓 SSE: Ping recebido (keep-alive)');
              continue;
            }
            
            if (trimmedLine.startsWith('event: ')) {
              currentEvent = trimmedLine.substring(7).trim();
              console.log('📨 SSE: Evento detectado:', currentEvent);
              continue;
            }
            
            if (trimmedLine.startsWith('data: ')) {
              currentData = trimmedLine.substring(6).trim();
              console.log('📨 SSE: Dados recebidos:', currentData);
              
              // Se a linha está vazia após 'data:', é o fim do evento
              if (trimmedLine === 'data:' || currentData === '') {
                if (currentEvent && currentData) {
                  console.log('📨 SSE: Processando evento completo:', currentEvent, currentData);
                  processSSEEvent(currentEvent, currentData);
                }
                currentEvent = '';
                currentData = '';
                continue;
              }
              
              // Se temos dados, processa
              if (currentData) {
                console.log('📨 SSE: Processando evento com dados:', currentEvent, currentData);
                processSSEEvent(currentEvent, currentData);
                currentEvent = '';
                currentData = '';
              }
            } else if (trimmedLine === '' && currentData) {
              // Linha vazia indica fim do evento
              if (currentData) {
                console.log('📨 SSE: Processando evento (linha vazia):', currentEvent, currentData);
                processSSEEvent(currentEvent, currentData);
                currentEvent = '';
                currentData = '';
              }
            }
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('📡 SSE: Conexão abortada (limpeza)');
          return;
        }
        
        console.error('❌ SSE: Erro na conexão:', error);
        
        // Reconexão automática com backoff exponencial
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`🔄 SSE: Tentando reconectar em ${delay}ms... (tentativa ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeout = setTimeout(() => {
            reconnectAttempts++;
            connectSSE();
          }, delay);
        } else {
          console.error('❌ SSE: Máximo de tentativas de reconexão atingido');
        }
      }
    };

    const processSSEEvent = (eventType: string, data: string) => {
      try {
        if (!data) return;
        
        const parsed = JSON.parse(data);
        console.log('📨 SSE: Evento recebido:', eventType, parsed);
        
        if (eventType === 'connected' || parsed.message === 'Conectado') {
          console.log('✅ SSE: Conectado com sucesso');
        } else if (eventType === 'transacao-nova' || parsed.tipo === 'transacao') {
          console.log('📡 SSE: Nova transação detectada, recarregando dados...');
          // Recarrega dados quando recebe notificação de nova transação
          // Usa valores atuais diretamente (não precisa de refs)
          carregarDados(paginaAtual);
          showSuccess('Nova transação registrada!');
        } else if (eventType === 'categoria-removida' || parsed.tipo === 'categoria') {
          console.log('📡 SSE: Categoria atualizada, recarregando dados...');
          // Recarrega dados quando categoria é atualizada
          carregarDados(paginaAtual);
        }
      } catch (e) {
        console.error('❌ SSE: Erro ao processar evento:', e, 'Data:', data);
      }
    };

    connectSSE();

    return () => {
      console.log('🧹 SSE: Limpando conexão...');
      if (abortController) {
        abortController.abort();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token, authLoading]); // Removido paginaAtual, carregarDados e showSuccess das dependências

  // Polling de notificações (fallback quando SSE não funciona)
  useEffect(() => {
    if (!isAuthenticated || !token || authLoading) {
      return;
    }

    console.log('🔄 Polling: Iniciando verificação de notificações...');
    
    let pollingInterval: ReturnType<typeof setInterval> | null = null;
    
    const verificarNotificacoes = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/notificacoes`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.warn('⚠️ Polling: Erro ao buscar notificações:', response.status);
          return;
        }

        const data = await response.json();
        
        if (data.success && data.notificacoes && data.notificacoes.length > 0) {
          console.log(`📨 Polling: ${data.notificacoes.length} notificação(ões) encontrada(s)`);
          
          // Processa cada notificação
          const idsParaMarcar: number[] = [];
          for (const notificacao of data.notificacoes) {
            console.log('📨 Polling: Processando notificação:', notificacao);
            
            if (notificacao.tipo === 'transacao-nova' || notificacao.dados?.tipo === 'transacao') {
              console.log('📡 Polling: Nova transação detectada, recarregando dados...');
              carregarDados(paginaAtual);
              showSuccess('Nova transação registrada!');
            } else if (notificacao.tipo === 'categoria-removida' || notificacao.dados?.tipo === 'categoria') {
              console.log('📡 Polling: Categoria atualizada, recarregando dados...');
              carregarDados(paginaAtual);
            }
            
            if (notificacao.id) {
              idsParaMarcar.push(notificacao.id);
            }
          }
          
          // Marca notificações como lidas
          if (idsParaMarcar.length > 0) {
            try {
              await fetch(`${API_BASE_URL}/api/notificacoes/marcar-lidas`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ids: idsParaMarcar }),
              });
              console.log(`✅ Polling: ${idsParaMarcar.length} notificação(ões) marcada(s) como lida(s)`);
            } catch (error) {
              console.error('❌ Polling: Erro ao marcar notificações como lidas:', error);
            }
          }
        }
      } catch (error) {
        console.error('❌ Polling: Erro ao verificar notificações:', error);
      }
    };

    // Verifica imediatamente
    verificarNotificacoes();
    
    // Configura polling a cada 5 segundos
    pollingInterval = setInterval(verificarNotificacoes, 5000);
    
    return () => {
      console.log('🧹 Polling: Limpando intervalo...');
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token, authLoading, carregarDados, paginaAtual, showSuccess]);

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


  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme === 'dark' ? 'from-slate-900 to-slate-800' : 'from-slate-50 to-slate-100'}`}>
      {/* Prompt de Instalação PWA */}
      <InstallPrompt />
      
      {/* Header */}
      <header className={`shadow-sm border-b ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-3 lg:py-6">
          {/* Linha superior: Logo e ações */}
          <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4 gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-1 min-w-0">
              <Logo size={36} className="sm:w-12 sm:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16" />
              <div className="min-w-0 flex-1">
                <h1 className={`text-base sm:text-xl lg:text-2xl xl:text-3xl font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Zela</h1>
                <p className={`text-[9px] sm:text-xs lg:text-sm mt-0.5 hidden sm:block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Dashboard Administrativo</p>
              </div>
            </div>
            
            {/* Ações do header - compactas em mobile */}
            <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-3 flex-shrink-0">
              {/* Botão Dark Mode */}
              <motion.button
                onClick={() => {
                  console.log('🔘 Botão clicado, tema atual:', theme);
                  toggleTheme();
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`p-1 sm:p-1.5 lg:p-2 rounded-lg transition-colors flex-shrink-0 ${theme === 'dark' ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
              >
                {theme === 'light' ? <FaMoon size={14} className="sm:w-4 sm:h-4 lg:w-5 lg:h-5" /> : <FaSun size={14} className="sm:w-4 sm:h-4 lg:w-5 lg:h-5" />}
              </motion.button>
              
              {/* Botão de Configurações/Perfil */}
              <motion.button
                onClick={() => setConfiguracoesAberto(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full transition-all hover:ring-2 hover:ring-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 flex-shrink-0"
                title="Configurações da conta"
              >
                <Avatar 
                  nome={usuario?.nome} 
                  telefone={usuario?.telefone} 
                  size={24}
                  className="cursor-pointer sm:w-9 sm:h-9 lg:w-10 lg:h-10"
                />
              </motion.button>
              
              {/* Informações do usuário - completamente ocultas em mobile */}
              {usuario && (
                <div className="text-right hidden xl:block">
                  <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Conectado Como</div>
                  <div className={`text-xs font-medium truncate max-w-[120px] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatarNumero(usuario.telefone)}
                  </div>
                </div>
              )}
              
              {/* Botão Sair */}
              <motion.button
                onClick={logout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-1.5 sm:px-2.5 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg transition-colors font-medium text-[10px] sm:text-xs lg:text-sm shadow-sm flex-shrink-0 ${
                  isDark
                    ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30 border border-red-800'
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                <span className="hidden sm:inline">Sair</span>
                <span className="sm:hidden text-xs">✕</span>
              </motion.button>
              </div>
          </div>
              
              {/* Abas de navegação */}
          <div className="flex gap-1 sm:gap-1.5 lg:gap-2 overflow-x-auto pb-1 -mx-2 sm:-mx-4 lg:-mx-8 px-2 sm:px-4 lg:px-8 scrollbar-hide">
                <motion.button
                  onClick={() => setAbaAtiva('dashboard')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
              className={`px-2.5 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg text-[11px] sm:text-xs lg:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
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
              className={`px-2.5 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg text-[11px] sm:text-xs lg:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
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
              className={`px-2.5 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg text-[11px] sm:text-xs lg:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
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
          
          {/* Informações adicionais - apenas em desktop grande */}
              {usuario && (
            <div className="hidden xl:flex items-center justify-end gap-4 mt-2">
                <div className="text-right">
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Conectado Como</div>
                <div className={`text-xs font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatarNumero(usuario.telefone)}
                  </div>
                </div>
              <div className="text-right">
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Última Atualização</div>
                <div className={`text-xs font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Banner de Trial */}
      {usuario && usuario.status === 'trial' && usuario.diasRestantesTrial !== null && usuario.diasRestantesTrial !== undefined && (
        <div className={`max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pt-2 sm:pt-4`}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg p-3 sm:p-4 border-2 ${
              usuario.diasRestantesTrial <= 3
                ? 'border-amber-400 dark:border-amber-600'
                : 'border-green-500 dark:border-green-600'
            } bg-transparent`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 flex-1">
                <div className="flex-shrink-0">
                  {usuario.diasRestantesTrial <= 3 ? (
                    <FaExclamationTriangle className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} size={14} />
                  ) : (
                    <FaGift className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'}`} size={14} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm sm:text-base font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {usuario.diasRestantesTrial <= 3
                      ? `Seu trial expira em ${usuario.diasRestantesTrial} ${usuario.diasRestantesTrial === 1 ? 'dia' : 'dias'}!`
                      : `Trial ativo: ${usuario.diasRestantesTrial} ${usuario.diasRestantesTrial === 1 ? 'dia restante' : 'dias restantes'}`
                    }
                  </p>
                  <p className={`text-xs sm:text-sm mt-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
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

      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-6 lg:py-8">
        {/* Cards de Estatísticas */}
        {estatisticas && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className={`rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 lg:p-6 border hover:shadow-md transition-shadow ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
            >
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <p className={`text-xs sm:text-sm font-medium truncate pr-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Total Gasto</p>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AnimatedIcon delay={0.1}>
                    <FaChartLine className="text-primary-600 w-3 h-3 sm:w-4 sm:h-4" />
                  </AnimatedIcon>
                </div>
              </div>
              <p className={`text-base sm:text-xl lg:text-2xl xl:text-3xl font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatarMoeda(estatisticas.totalGasto)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className={`rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 lg:p-6 border hover:shadow-md transition-shadow ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
            >
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <p className={`text-xs sm:text-sm font-medium truncate pr-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Total Transações</p>
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
              className={`rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 lg:p-6 border hover:shadow-md transition-shadow ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
            >
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <p className={`text-xs sm:text-sm font-medium truncate pr-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Gasto Hoje</p>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AnimatedIcon delay={0.3}>
                    <FaCalendarDay className="text-primary-600 w-3 h-3 sm:w-4 sm:h-4" />
                  </AnimatedIcon>
                </div>
              </div>
              <p className={`text-base sm:text-xl lg:text-2xl xl:text-3xl font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {formatarMoeda(estatisticas.gastoHoje)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className={`rounded-lg sm:rounded-xl shadow-sm p-3 sm:p-4 lg:p-6 border hover:shadow-md transition-shadow ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
            >
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <p className={`text-xs sm:text-sm font-medium truncate pr-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Média por Transação</p>
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gold-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AnimatedIcon delay={0.4}>
                    <FaChartBar className="text-gold-600 w-3 h-3 sm:w-4 sm:h-4" />
                  </AnimatedIcon>
                </div>
              </div>
              <p className={`text-base sm:text-xl lg:text-2xl xl:text-3xl font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
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
