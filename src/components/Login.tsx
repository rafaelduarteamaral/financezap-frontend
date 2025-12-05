import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Logo } from './Logo';
import { motion } from 'framer-motion';
import { FaWhatsapp, FaKey, FaUserPlus } from 'react-icons/fa';
import { api } from '../services/api';
import { Cadastro } from './Cadastro';
import { formatPhone, unformatPhone } from '../utils/formatPhone';

export function Login() {
  const [telefone, setTelefone] = useState('');
  const [telefoneFormatado, setTelefoneFormatado] = useState('');
  const [codigo, setCodigo] = useState('');
  const [etapa, setEtapa] = useState<'telefone' | 'codigo' | 'cadastro'>('telefone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sucesso, setSucesso] = useState('');
  const { login } = useAuth();

  const handleSolicitarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSucesso('');
    
    // Usa o telefone sem formatação (apenas números)
    const telefoneLimpo = unformatPhone(telefone);
    
    if (!telefoneLimpo.trim()) {
      setError('Por favor, informe seu número de telefone');
      return;
    }

    setLoading(true);
    try {
      const response = await api.solicitarCodigo(telefoneLimpo);
      
      if (response.success) {
        if (response.codigo) {
          // Em desenvolvimento, se o código vier no response (limite excedido)
          setSucesso(`Código gerado: ${response.codigo} (limite do Twilio excedido - modo desenvolvimento)`);
        } else {
          setSucesso('Código enviado! Verifique seu WhatsApp.');
        }
        setEtapa('codigo');
      } else {
        // Se o número não foi encontrado, vai direto para cadastro
        const errorMsg = response.error || '';
        if (errorMsg.includes('não encontrado') || errorMsg.includes('não existe') || errorMsg.includes('precisa ter enviado')) {
          // Número não cadastrado - vai para cadastro mantendo o número
          setEtapa('cadastro');
          setSucesso('Número não cadastrado. Complete seu cadastro para continuar.');
        } else {
          setError(errorMsg || 'Erro ao solicitar código');
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao solicitar código. Tente novamente.';
      // Se o erro indicar que o número não foi encontrado, vai para cadastro
      if (errorMsg.includes('não encontrado') || errorMsg.includes('não existe') || errorMsg.includes('precisa ter enviado')) {
        setEtapa('cadastro');
        setSucesso('Número não cadastrado. Complete seu cadastro para continuar.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!codigo.trim()) {
      setError('Por favor, informe o código de verificação');
      return;
    }

    if (codigo.trim().length !== 6) {
      setError('O código deve ter 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      // Usa o telefone sem formatação (apenas números)
      const telefoneLimpo = unformatPhone(telefone);
      const response = await api.verificarCodigo(telefoneLimpo, codigo);
      
      if (response.success && response.token) {
        // Verifica se precisa cadastro
        if (response.precisaCadastro) {
          setError('Usuário não cadastrado. Por favor, faça o cadastro primeiro.');
          setEtapa('cadastro');
          return;
        }
        
        // Verifica se trial expirou
        if (response.trialExpirado) {
          setError('Seu período de trial expirou. Por favor, assine um plano para continuar usando o sistema.');
          return;
        }
        
        // Salva o token e informações do usuário
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('auth_usuario', JSON.stringify({ 
          telefone: response.telefone,
          nome: response.usuario?.nome,
          status: response.usuario?.status,
          diasRestantesTrial: response.usuario?.diasRestantesTrial
        }));
        login(response.telefone, response.token);
      } else {
        setError(response.error || 'Código inválido ou expirado');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao verificar código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const voltarParaTelefone = () => {
    setEtapa('telefone');
    setCodigo('');
    setError('');
    setSucesso('');
  };

  const irParaCadastro = () => {
    setEtapa('cadastro');
    setError('');
    setSucesso('');
  };

  const voltarDoCadastro = () => {
    setEtapa('telefone');
    setError('');
    setSucesso('');
  };

  const handleCadastroSucesso = () => {
    // Volta para a tela de telefone mantendo o número preenchido
    setEtapa('telefone');
    setError('');
    setSucesso('Cadastro realizado com sucesso! Agora você pode solicitar o código de verificação.');
    // Mantém o telefone preenchido e formatado para facilitar o login
    if (telefone) {
      setTelefoneFormatado(formatPhone(telefone));
    }
  };

  // Se estiver na etapa de cadastro, mostra o componente de cadastro
  if (etapa === 'cadastro') {
    return <Cadastro telefoneInicial={telefone} onVoltar={voltarDoCadastro} onCadastroSucesso={handleCadastroSucesso} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
          {/* Logo e Título */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-block mb-4"
            >
              <Logo size={64} />
            </motion.div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Zela
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {etapa === 'telefone' 
                ? 'Digite seu número para receber o código de verificação'
                : 'Digite o código enviado via WhatsApp'}
            </p>
          </div>

          {/* Mensagens de erro/sucesso */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </motion.div>
          )}

          {sucesso && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            >
              <p className="text-sm text-green-600 dark:text-green-400">{sucesso}</p>
            </motion.div>
          )}

          {/* Formulário - Etapa 1: Telefone */}
          {etapa === 'telefone' && (
            <form onSubmit={handleSolicitarCodigo} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Número de Telefone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaWhatsapp className="text-slate-400" size={20} />
                  </div>
                  <input
                    type="tel"
                    value={telefoneFormatado}
                    onChange={(e) => {
                      // Remove formatação para obter apenas números
                      const apenasNumeros = unformatPhone(e.target.value);
                      // Limita a 11 dígitos
                      const numerosLimitados = apenasNumeros.slice(0, 11);
                      // Atualiza o valor formatado para exibição
                      setTelefoneFormatado(formatPhone(numerosLimitados));
                      // Mantém o valor sem formatação para uso interno
                      setTelefone(numerosLimitados);
                    }}
                    placeholder="(61) 98147-4690"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={loading}
                    inputMode="tel"
                    maxLength={15}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Você receberá um código de 6 dígitos via WhatsApp
                </p>
              </div>

              <motion.button
                type="submit"
                disabled={loading || !telefone.trim()}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Enviando código...</span>
                  </>
                ) : (
                  <>
                    <FaWhatsapp size={18} />
                    <span>Enviar Código via WhatsApp</span>
                  </>
                )}
              </motion.button>
            </form>
          )}

          {/* Formulário - Etapa 2: Código */}
          {etapa === 'codigo' && (
            <form onSubmit={handleVerificarCodigo} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Código de Verificação
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaKey className="text-slate-400" size={20} />
                  </div>
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Digite o código de 6 dígitos enviado para {telefoneFormatado || telefone}
                </p>
              </div>

              <div className="flex gap-3">
                <motion.button
                  type="button"
                  onClick={voltarParaTelefone}
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="flex-1 py-3 px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Voltar
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={loading || codigo.trim().length !== 6}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className="flex-1 py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <FaKey size={18} />
                      <span>Verificar Código</span>
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          )}

          {/* Link para cadastro */}
          {etapa === 'telefone' && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-center text-slate-500 dark:text-slate-400 mb-3">
                Não tem uma conta?
              </p>
              <motion.button
                type="button"
                onClick={irParaCadastro}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <FaUserPlus size={16} />
                <span>Criar conta grátis (7 dias de trial)</span>
              </motion.button>
            </div>
          )}

          {/* Informações adicionais */}
          {etapa === 'codigo' && (
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                O código expira em 5 minutos
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
