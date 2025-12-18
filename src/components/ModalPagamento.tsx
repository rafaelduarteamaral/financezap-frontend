import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { 
  FaTimes, 
  FaCreditCard, 
  FaQrcode,
  FaLock,
  FaCheckCircle,
  FaSpinner,
  FaCopy
} from 'react-icons/fa';

interface ModalPagamentoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  plano: {
    id: string;
    nome: string;
    preco: number;
    periodo: string;
  } | null;
}

export function ModalPagamento({ isOpen, onClose, onSuccess, plano }: ModalPagamentoProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [metodoPagamento, setMetodoPagamento] = useState<'cartao' | 'pix'>('cartao');
  const [processando, setProcessando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [copiado, setCopiado] = useState(false);
  
  // Campos do cartão
  const [numeroCartao, setNumeroCartao] = useState('');
  const [nomeCartao, setNomeCartao] = useState('');
  const [validade, setValidade] = useState('');
  const [cvv, setCvv] = useState('');

  // Formata número do cartão
  const formatarNumeroCartao = (value: string) => {
    const numero = value.replace(/\D/g, '');
    const grupos = numero.match(/.{1,4}/g);
    return grupos ? grupos.join(' ').substring(0, 19) : '';
  };

  // Formata validade
  const formatarValidade = (value: string) => {
    const numero = value.replace(/\D/g, '');
    if (numero.length >= 2) {
      return numero.substring(0, 2) + '/' + numero.substring(2, 4);
    }
    return numero;
  };

  // PIX fake para demonstração
  const chavePix = 'pix@usezela.com';

  const copiarChavePix = () => {
    navigator.clipboard.writeText(chavePix);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleConfirmarPagamento = async () => {
    setProcessando(true);
    
    // Simula processamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSucesso(true);
    
    // Aguarda um pouco para mostrar sucesso
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onSuccess();
    
    // Reset
    setProcessando(false);
    setSucesso(false);
    setNumeroCartao('');
    setNomeCartao('');
    setValidade('');
    setCvv('');
  };

  const fecharModal = () => {
    if (!processando) {
      onClose();
      // Reset estados
      setMetodoPagamento('cartao');
      setSucesso(false);
      setNumeroCartao('');
      setNomeCartao('');
      setValidade('');
      setCvv('');
    }
  };

  if (!isOpen || !plano) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={fecharModal}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${
            isDark ? 'bg-slate-800' : 'bg-white'
          }`}
        >
          {/* Header */}
          <div className={`p-6 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Finalizar Assinatura
                </h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Plano {plano.nome} - R$ {plano.preco.toFixed(2)}/{plano.periodo}
                </p>
              </div>
              <button
                onClick={fecharModal}
                disabled={processando}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'hover:bg-slate-700 text-slate-400' 
                    : 'hover:bg-slate-100 text-slate-500'
                } ${processando ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <FaTimes size={20} />
              </button>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-6">
            {sucesso ? (
              // Tela de sucesso
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                  <FaCheckCircle className="text-green-500" size={40} />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Pagamento Confirmado!
                </h3>
                <p className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Sua assinatura foi ativada com sucesso.
                </p>
              </motion.div>
            ) : (
              <>
                {/* Seletor de método de pagamento */}
                <div className="flex gap-3 mb-6">
                  <button
                    onClick={() => setMetodoPagamento('cartao')}
                    disabled={processando}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                      metodoPagamento === 'cartao'
                        ? 'border-primary-500 bg-primary-500/10'
                        : isDark
                        ? 'border-slate-600 hover:border-slate-500'
                        : 'border-slate-200 hover:border-slate-300'
                    } ${processando ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <FaCreditCard className={metodoPagamento === 'cartao' ? 'text-primary-500' : isDark ? 'text-slate-400' : 'text-slate-500'} />
                    <span className={`font-medium ${
                      metodoPagamento === 'cartao' 
                        ? 'text-primary-500' 
                        : isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Cartão de Crédito
                    </span>
                  </button>
                  <button
                    onClick={() => setMetodoPagamento('pix')}
                    disabled={processando}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                      metodoPagamento === 'pix'
                        ? 'border-primary-500 bg-primary-500/10'
                        : isDark
                        ? 'border-slate-600 hover:border-slate-500'
                        : 'border-slate-200 hover:border-slate-300'
                    } ${processando ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <FaQrcode className={metodoPagamento === 'pix' ? 'text-primary-500' : isDark ? 'text-slate-400' : 'text-slate-500'} />
                    <span className={`font-medium ${
                      metodoPagamento === 'pix' 
                        ? 'text-primary-500' 
                        : isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      PIX
                    </span>
                  </button>
                </div>

                {metodoPagamento === 'cartao' ? (
                  // Formulário de cartão
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Número do Cartão
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={numeroCartao}
                          onChange={(e) => setNumeroCartao(formatarNumeroCartao(e.target.value))}
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                          disabled={processando}
                          className={`w-full px-4 py-3 rounded-lg border ${
                            isDark 
                              ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' 
                              : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                          } focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            processando ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        />
                        <FaCreditCard className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Nome no Cartão
                      </label>
                      <input
                        type="text"
                        value={nomeCartao}
                        onChange={(e) => setNomeCartao(e.target.value.toUpperCase())}
                        placeholder="NOME COMO ESTÁ NO CARTÃO"
                        disabled={processando}
                        className={`w-full px-4 py-3 rounded-lg border ${
                          isDark 
                            ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' 
                            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                        } focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          processando ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Validade
                        </label>
                        <input
                          type="text"
                          value={validade}
                          onChange={(e) => setValidade(formatarValidade(e.target.value))}
                          placeholder="MM/AA"
                          maxLength={5}
                          disabled={processando}
                          className={`w-full px-4 py-3 rounded-lg border ${
                            isDark 
                              ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' 
                              : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                          } focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            processando ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          CVV
                        </label>
                        <input
                          type="text"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                          placeholder="123"
                          maxLength={4}
                          disabled={processando}
                          className={`w-full px-4 py-3 rounded-lg border ${
                            isDark 
                              ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' 
                              : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                          } focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            processando ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  // PIX
                  <div className="text-center">
                    <div className={`inline-block p-4 rounded-2xl mb-4 ${isDark ? 'bg-white' : 'bg-slate-100'}`}>
                      {/* QR Code visual (placeholder) */}
                      <div className="w-48 h-48 bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-2 grid grid-cols-8 gap-0.5">
                          {Array.from({ length: 64 }).map((_, i) => (
                            <div
                              key={i}
                              className={`${Math.random() > 0.5 ? 'bg-white' : 'bg-slate-900'}`}
                            />
                          ))}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                            <span className="text-xl font-bold text-primary-500">Z</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Ou copie a chave PIX:
                    </p>
                    
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                      <code className={`flex-1 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {chavePix}
                      </code>
                      <button
                        onClick={copiarChavePix}
                        disabled={processando}
                        className={`p-2 rounded-lg transition-colors ${
                          copiado 
                            ? 'bg-green-500 text-white' 
                            : isDark 
                            ? 'bg-slate-600 hover:bg-slate-500 text-white' 
                            : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        }`}
                      >
                        {copiado ? <FaCheckCircle size={16} /> : <FaCopy size={16} />}
                      </button>
                    </div>

                    <p className={`text-xs mt-4 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                      Valor: <strong>R$ {plano.preco.toFixed(2)}</strong>
                    </p>
                  </div>
                )}

                {/* Botão de confirmação */}
                <motion.button
                  onClick={handleConfirmarPagamento}
                  disabled={processando}
                  whileHover={!processando ? { scale: 1.02 } : {}}
                  whileTap={!processando ? { scale: 0.98 } : {}}
                  className={`w-full mt-6 py-4 rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
                    processando
                      ? 'bg-slate-500 cursor-not-allowed'
                      : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  {processando ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <FaLock size={14} />
                      {metodoPagamento === 'cartao' ? 'Pagar com Cartão' : 'Confirmar Pagamento PIX'}
                    </>
                  )}
                </motion.button>

                {/* Segurança */}
                <p className={`text-xs text-center mt-4 flex items-center justify-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  <FaLock size={10} />
                  Pagamento seguro e criptografado
                </p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

