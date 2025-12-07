import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { Avatar } from './Avatar';
import { motion } from 'framer-motion';
import { 
  FaUser, 
  FaCreditCard, 
  FaCheckCircle, 
  FaTimes, 
  FaCrown,
  FaStar,
  FaGem,
  FaSave,
  FaEdit,
  FaWhatsapp,
  FaUserPlus,
  FaTrash,
  FaExclamationTriangle,
} from 'react-icons/fa';

interface ConfiguracoesProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Plano {
  id: string;
  nome: string;
  preco: number;
  periodo: string;
  descricao: string;
  features: string[];
  popular?: boolean;
  icon: any;
  color: string;
}

const PLANOS: Plano[] = [
  {
    id: 'mensal',
    nome: 'Mensal',
    preco: 30.00,
    periodo: 'mês',
    descricao: 'Plano mensal',
    features: [
      'Transações ilimitadas',
      'Agendamentos ilimitados',
      'Relatórios completos',
      'IA Financeira',
      'Suporte por email',
      'Exportação de dados'
    ],
    icon: FaStar,
    color: 'blue'
  },
  {
    id: 'trimestral',
    nome: 'Trimestral',
    preco: 81.00, // 3 meses com 10% de desconto: (30 * 3) * 0.9 = 81
    periodo: 'trimestre',
    descricao: '3 meses com 10% de desconto',
    features: [
      'Transações ilimitadas',
      'Agendamentos ilimitados',
      'Relatórios completos',
      'IA Financeira',
      'Suporte por email',
      'Exportação de dados',
      'Economia de R$ 9,00'
    ],
    popular: true,
    icon: FaCrown,
    color: 'gold'
  },
  {
    id: 'anual',
    nome: 'Anual',
    preco: 252.00, // 12 meses com 30% de desconto: (30 * 12) * 0.7 = 252
    periodo: 'ano',
    descricao: '12 meses com 30% de desconto',
    features: [
      'Transações ilimitadas',
      'Agendamentos ilimitados',
      'Relatórios completos',
      'IA Financeira',
      'Suporte prioritário',
      'Exportação de dados',
      'Economia de R$ 108,00',
      'Melhor custo-benefício'
    ],
    icon: FaGem,
    color: 'purple'
  }
];

export function Configuracoes({ isOpen, onClose }: ConfiguracoesProps) {
  const { usuario, atualizarUsuario } = useAuth();
  const { theme } = useTheme();
  const { showSuccess, showError, showInfo } = useToast();
  const isDark = theme === 'dark';
  
  const [abaAtiva, setAbaAtiva] = useState<'perfil' | 'planos'>('perfil');
  const [editando, setEditando] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [enviandoContato, setEnviandoContato] = useState(false);
  const [excluindoDados, setExcluindoDados] = useState(false);
  const [mostrarConfirmacaoExclusao, setMostrarConfirmacaoExclusao] = useState(false);
  

  // Atualiza os estados quando o usuário muda ou quando o modal abre
  useEffect(() => {
    if (isOpen) {
      if (usuario) {
        console.log('📝 Carregando dados do usuário:', usuario);
        setNome(usuario.nome || '');
        // Carrega email se disponível
        setEmail(usuario.email || '');
      } else {
        setNome('');
        setEmail('');
      }
      // Reseta o modo de edição quando abre o modal
      setEditando(false);
    }
  }, [usuario, isOpen, abaAtiva]);

  const handleSalvarPerfil = async () => {
    if (!nome.trim()) {
      showError('Por favor, informe seu nome');
      return;
    }

    setSalvando(true);
    try {
      console.log('💾 Salvando perfil no backend...', { nome: nome.trim(), email: email.trim() || undefined });
      
      // Chama a API para salvar no backend
      const response = await api.atualizarPerfil({ 
        nome: nome.trim(), 
        email: email.trim() || undefined 
      });
      
      if (response.success) {
        console.log('✅ Perfil salvo no backend:', response.usuario);
        
        // Atualiza o contexto e localStorage com os dados atualizados do backend
        atualizarUsuario({ 
          nome: response.usuario.nome,
          email: response.usuario.email 
        });
        
        setSalvando(false);
        setEditando(false);
        showSuccess('Dados salvos com sucesso!');
      } else {
        throw new Error(response.error || 'Erro ao salvar perfil');
      }
    } catch (error: any) {
      console.error('❌ Erro ao salvar perfil:', error);
      setSalvando(false);
      showError(`Erro ao salvar: ${error.message}`);
    }
  };

  const handleAssinarPlano = async (planoId: string) => {
    // TODO: Implementar integração com gateway de pagamento
    console.log('Assinando plano:', planoId);
    showInfo(`Redirecionando para assinatura do plano ${planoId}...`);
  };

  const handleEnviarContato = async () => {
    setEnviandoContato(true);
    try {
      console.log('📱 Solicitando envio de mensagem para salvar contato...');
      const response = await api.enviarMensagemContato();
      
      if (response.success) {
        showSuccess('Mensagem enviada! Verifique seu WhatsApp para ver as instruções de como salvar nosso contato.');
      } else {
        throw new Error(response.error || 'Erro ao enviar mensagem');
      }
    } catch (error: any) {
      console.error('❌ Erro ao enviar mensagem de contato:', error);
      showError(`Erro ao enviar mensagem: ${error.message}`);
    } finally {
      setEnviandoContato(false);
    }
  };

  const handleExcluirTodosDados = async () => {
    setExcluindoDados(true);
    try {
      console.log('🗑️  Solicitando exclusão completa de dados (LGPD)...');
      const response = await api.excluirTodosDados();
      
      if (response.success) {
        const dadosRemovidos = response.dadosRemovidos || { transacoes: 0, agendamentos: 0, categorias: 0 };
        showSuccess(`Todos os seus dados foram excluídos permanentemente.\n\nDados removidos:\n- ${dadosRemovidos.transacoes || 0} transações\n- ${dadosRemovidos.agendamentos || 0} agendamentos\n- ${dadosRemovidos.categorias || 0} categorias\n\nVocê será redirecionado para a tela de login.`);
        
        // Limpa localStorage e redireciona
        setTimeout(() => {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_usuario');
          window.location.href = '/login';
        }, 2000);
      } else {
        throw new Error(response.error || 'Erro ao excluir dados');
      }
    } catch (error: any) {
      console.error('❌ Erro ao excluir dados:', error);
      showError(`Erro ao excluir dados: ${error.message}`);
    } finally {
      setExcluindoDados(false);
      setMostrarConfirmacaoExclusao(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50"
        />

        {/* Modal */}
        <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl ${
          isDark ? 'bg-slate-800' : 'bg-white'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDark ? 'border-slate-700' : 'border-slate-200'
        }`}>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Configurações
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-slate-700 text-slate-400 hover:text-white'
                : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Abas */}
        <div className={`flex border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <button
            onClick={() => setAbaAtiva('perfil')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              abaAtiva === 'perfil'
                ? isDark
                  ? 'bg-slate-700 text-white border-b-2 border-primary-500'
                  : 'bg-slate-50 text-slate-900 border-b-2 border-primary-600'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FaUser size={16} />
              Dados Pessoais
            </div>
          </button>
          <button
            onClick={() => setAbaAtiva('planos')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              abaAtiva === 'planos'
                ? isDark
                  ? 'bg-slate-700 text-white border-b-2 border-primary-500'
                  : 'bg-slate-50 text-slate-900 border-b-2 border-primary-600'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FaCreditCard size={16} />
              Planos e Assinatura
            </div>
          </button>
        </div>

        {/* Conteúdo */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
          {abaAtiva === 'perfil' && (
            <div className="space-y-6">
              <div>
                {/* Avatar do usuário */}
                <div className="flex items-center gap-4 mb-6">
                  <Avatar 
                    nome={usuario?.nome} 
                    telefone={usuario?.telefone} 
                    size={80}
                    className="ring-4 ring-primary-500/20"
                  />
                  <div>
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {usuario?.nome || 'Usuário'}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {usuario?.telefone || 'Não informado'}
                    </p>
                  </div>
                </div>

                <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Informações Pessoais
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Nome
                    </label>
                    {editando ? (
                      <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDark
                            ? 'bg-slate-700 border-slate-600 text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        } focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                        placeholder="Seu nome"
                      />
                    ) : (
                      <div className={`px-4 py-2 rounded-lg ${
                        isDark ? 'bg-slate-700 text-white' : 'bg-slate-50 text-slate-900'
                      }`}>
                        {nome || 'Não informado'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Telefone (não editável)
                    </label>
                    <div className={`px-4 py-2 rounded-lg ${
                      isDark ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {usuario?.telefone || 'Não informado'}
                    </div>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      O número de WhatsApp não pode ser alterado
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      E-mail
                    </label>
                    {editando ? (
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          isDark
                            ? 'bg-slate-700 border-slate-600 text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        } focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
                        placeholder="seu@email.com"
                      />
                    ) : (
                      <div className={`px-4 py-2 rounded-lg ${
                        isDark ? 'bg-slate-700 text-white' : 'bg-slate-50 text-slate-900'
                      }`}>
                        {email || 'Não informado'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Status da Conta
                    </label>
                    <div className={`px-4 py-2 rounded-lg flex items-center gap-2 border-2 bg-transparent ${
                      usuario?.status === 'ativo'
                        ? 'border-green-500 dark:border-green-600'
                        : usuario?.status === 'trial'
                        ? 'border-green-500 dark:border-green-600'
                        : 'border-red-500 dark:border-red-600'
                    }`}>
                      {usuario?.status === 'ativo' ? (
                        <FaCheckCircle className={isDark ? 'text-white' : 'text-slate-900'} />
                      ) : usuario?.status === 'trial' ? (
                        <FaStar className={isDark ? 'text-white' : 'text-slate-900'} />
                      ) : (
                        <FaTimes className={isDark ? 'text-white' : 'text-slate-900'} />
                      )}
                      <span className={`capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {usuario?.status === 'trial' 
                          ? `Trial (${usuario.diasRestantesTrial || 0} dias restantes)`
                          : usuario?.status || 'Não definido'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botões de ação (Editar/Salvar) */}
                <div className="flex gap-3 mt-6">
                  {editando ? (
                    <>
                      <motion.button
                        onClick={handleSalvarPerfil}
                        disabled={salvando}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50"
                      >
                        <FaSave size={16} />
                        {salvando ? 'Salvando...' : 'Salvar'}
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          setEditando(false);
                          // Restaura valores originais
                          setNome(usuario?.nome || '');
                          setEmail(usuario?.email || '');
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          isDark
                            ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Cancelar
                      </motion.button>
                    </>
                  ) : (
                    <motion.button
                      onClick={() => {
                        console.log('✏️ Entrando em modo de edição');
                        setEditando(true);
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
                    >
                      <FaEdit size={16} />
                      Editar
                    </motion.button>
                  )}
                </div>

                {/* Botão para enviar contato */}
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-lg ${
                        isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600'
                      }`}>
                        <FaWhatsapp size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Salvar Contato no WhatsApp
                        </h4>
                        <p className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Apagou nosso contato? Clique aqui para receber uma mensagem com instruções de como salvar novamente.
                        </p>
                        <motion.button
                          onClick={handleEnviarContato}
                          disabled={enviandoContato}
                          whileHover={{ scale: enviandoContato ? 1 : 1.02 }}
                          whileTap={{ scale: enviandoContato ? 1 : 0.98 }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                            enviandoContato
                              ? 'bg-slate-400 text-white cursor-not-allowed'
                              : isDark
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        >
                          {enviandoContato ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Enviando...
                            </>
                          ) : (
                            <>
                              <FaUserPlus size={14} />
                              Enviar Instruções
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Seção LGPD - Exclusão de Dados */}
                  <div className="mt-6 pt-6 border-t border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-lg ${
                        isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'
                      }`}>
                        <FaExclamationTriangle size={20} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Exclusão de Dados (LGPD)
                        </h4>
                        <p className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Conforme a Lei Geral de Proteção de Dados (LGPD), você tem o direito de solicitar a exclusão permanente de todos os seus dados cadastrados em nossa plataforma. Esta ação é irreversível e removerá:
                        </p>
                        <ul className={`text-xs mb-4 space-y-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          <li>• Todas as suas transações financeiras</li>
                          <li>• Todos os seus agendamentos</li>
                          <li>• Suas categorias personalizadas</li>
                          <li>• Seus dados pessoais (nome, email, telefone)</li>
                          <li>• Seu histórico completo na plataforma</li>
                        </ul>
                        {!mostrarConfirmacaoExclusao ? (
                          <motion.button
                            onClick={() => setMostrarConfirmacaoExclusao(true)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                              isDark
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                          >
                            <FaTrash size={14} />
                            Solicitar Exclusão de Dados
                          </motion.button>
                        ) : (
                          <div className="space-y-3">
                            <div className={`p-3 rounded-lg border-2 ${
                              isDark 
                                ? 'bg-red-900/20 border-red-800 text-red-300' 
                                : 'bg-red-50 border-red-200 text-red-800'
                            }`}>
                              <p className="text-sm font-medium mb-2">⚠️ Atenção: Esta ação é irreversível!</p>
                              <p className="text-xs">
                                Todos os seus dados serão excluídos permanentemente e você precisará criar uma nova conta para usar a plataforma novamente.
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <motion.button
                                onClick={handleExcluirTodosDados}
                                disabled={excluindoDados}
                                whileHover={{ scale: excluindoDados ? 1 : 1.02 }}
                                whileTap={{ scale: excluindoDados ? 1 : 0.98 }}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                  excluindoDados
                                    ? 'bg-slate-400 text-white cursor-not-allowed'
                                    : isDark
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                                }`}
                              >
                                {excluindoDados ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Excluindo...
                                  </>
                                ) : (
                                  <>
                                    <FaTrash size={14} />
                                    Confirmar Exclusão
                                  </>
                                )}
                              </motion.button>
                              <motion.button
                                onClick={() => setMostrarConfirmacaoExclusao(false)}
                                disabled={excluindoDados}
                                whileHover={{ scale: excluindoDados ? 1 : 1.02 }}
                                whileTap={{ scale: excluindoDados ? 1 : 0.98 }}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                  excluindoDados
                                    ? 'bg-slate-400 text-white cursor-not-allowed'
                                    : isDark
                                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                Cancelar
                              </motion.button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {abaAtiva === 'planos' && (
            <div className="space-y-6">
              <div>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Escolha seu Plano
                </h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Selecione o plano que melhor atende suas necessidades
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PLANOS.map((plano) => {
                  const Icon = plano.icon;
                  const isCurrentPlan = usuario?.status === plano.id;
                  
                  return (
                    <motion.div
                      key={plano.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      className={`relative rounded-xl p-6 border-2 transition-all ${
                        plano.popular
                          ? isDark
                            ? 'border-gold bg-gold-dark/10'
                            : 'border-gold-dark bg-gold-light/10'
                          : isDark
                          ? 'border-slate-700 bg-slate-800'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      {plano.popular && (
                        <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold ${
                          isDark ? 'bg-gold text-slate-900' : 'bg-gold-dark text-white'
                        }`}>
                          MAIS POPULAR
                        </div>
                      )}

                      <div className="text-center mb-4">
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                          plano.color === 'gold'
                            ? 'bg-gold-dark/20 text-gold-dark dark:bg-gold/20 dark:text-gold'
                            : plano.color === 'purple'
                            ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                            : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        }`}>
                          <Icon size={32} />
                        </div>
                        <h4 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {plano.nome}
                        </h4>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {plano.descricao}
                        </p>
                      </div>

                      <div className="text-center mb-6">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            R$ {plano.preco.toFixed(2)}
                          </span>
                          <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            /{plano.periodo}
                          </span>
                        </div>
                        {plano.id === 'trimestral' && (
                          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            R$ 27,00/mês (economia de 10%)
                          </p>
                        )}
                        {plano.id === 'anual' && (
                          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            R$ 21,00/mês (economia de 30%)
                          </p>
                        )}
                      </div>

                      <ul className="space-y-3 mb-6">
                        {plano.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <FaCheckCircle className={`mt-0.5 flex-shrink-0 ${
                              plano.popular ? 'text-gold-dark dark:text-gold' : 'text-primary-500'
                            }`} size={16} />
                            <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {isCurrentPlan ? (
                        <div className={`w-full py-2 rounded-lg text-center font-medium ${
                          isDark
                            ? 'bg-green-900/20 text-green-400 border border-green-800'
                            : 'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                          Plano Atual
                        </div>
                      ) : (
                        <motion.button
                          onClick={() => handleAssinarPlano(plano.id)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`w-full py-3 rounded-lg font-medium transition-colors ${
                            plano.popular
                              ? isDark
                                ? 'bg-gold text-slate-900 hover:bg-gold-dark'
                                : 'bg-gold-dark text-white hover:bg-gold'
                              : isDark
                              ? 'bg-primary-600 text-white hover:bg-primary-700'
                              : 'bg-primary-600 text-white hover:bg-primary-700'
                          }`}
                        >
                          Assinar Agora
                        </motion.button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        </motion.div>
      </div>
    </>
  );
}

