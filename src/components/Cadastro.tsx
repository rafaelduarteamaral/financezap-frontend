import { useState, useEffect } from 'react';
import { AnimatedIcon } from './AnimatedIcon';
import { motion } from 'framer-motion';
import { FaMoneyBillWave, FaUser, FaEnvelope, FaWhatsapp, FaArrowLeft } from 'react-icons/fa';
import { api } from '../services/api';
import { formatPhone, unformatPhone } from '../utils/formatPhone';

interface CadastroProps {
  telefoneInicial?: string;
  onVoltar: () => void;
  onCadastroSucesso: () => void;
}

export function Cadastro({ telefoneInicial, onVoltar, onCadastroSucesso }: CadastroProps) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState(telefoneInicial || '');
  const [telefoneFormatado, setTelefoneFormatado] = useState(telefoneInicial ? formatPhone(telefoneInicial) : '');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Atualiza o telefone quando telefoneInicial mudar
  useEffect(() => {
    if (telefoneInicial) {
      setTelefone(telefoneInicial);
      setTelefoneFormatado(formatPhone(telefoneInicial));
    }
  }, [telefoneInicial]);

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSucesso('');
    
    if (!nome.trim()) {
      setError('Por favor, informe seu nome');
      return;
    }
    
    // Usa o telefone sem formatação (apenas números)
    const telefoneLimpo = unformatPhone(telefone);
    
    if (!telefoneLimpo.trim()) {
      setError('Por favor, informe seu número de telefone');
      return;
    }

    setLoading(true);
    try {
      const response = await api.cadastro(telefoneLimpo, nome, email || undefined);
      
      if (response.success) {
        setSucesso('Cadastro realizado com sucesso! Seu trial de 7 dias foi ativado.');
        setTimeout(() => {
          onCadastroSucesso();
        }, 2000);
      } else {
        setError(response.error || 'Erro ao realizar cadastro');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

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
              <AnimatedIcon size={64}>
                <FaMoneyBillWave className="text-primary-600 dark:text-primary-400" />
              </AnimatedIcon>
            </motion.div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Criar Conta
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Cadastre-se e ganhe 7 dias grátis para testar!
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

          {/* Formulário de Cadastro */}
          <form onSubmit={handleCadastro} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nome Completo *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-slate-400" size={20} />
                </div>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Número de Telefone *
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
                  required
                  inputMode="tel"
                  maxLength={15}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Você receberá um código de verificação via WhatsApp
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                E-mail (Opcional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-slate-400" size={20} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Informação sobre Trial */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>🎁 Trial de 7 dias grátis!</strong>
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Após o período de trial, você precisará assinar um plano para continuar usando o sistema.
              </p>
            </div>

            <div className="flex gap-3">
              <motion.button
                type="button"
                onClick={onVoltar}
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="flex-1 py-3 px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FaArrowLeft size={16} />
                <span>Voltar</span>
              </motion.button>
              <motion.button
                type="submit"
                disabled={loading || !nome.trim() || !telefone.trim()}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="flex-1 py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Cadastrando...</span>
                  </>
                ) : (
                  <>
                    <FaUser size={18} />
                    <span>Criar Conta</span>
                  </>
                )}
              </motion.button>
            </div>
          </form>

          {/* Informações adicionais */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-center text-slate-500 dark:text-slate-400">
              Ao cadastrar, você concorda com nossos termos de uso
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

