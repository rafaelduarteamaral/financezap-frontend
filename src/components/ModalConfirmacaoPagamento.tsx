import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCheckCircle, FaWallet } from 'react-icons/fa';
import { CurrencyInputCustom } from './CurrencyInputCustom';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface Carteira {
  id: number;
  nome: string;
  tipo?: string;
  padrao?: boolean;
}

interface ModalConfirmacaoPagamentoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isDark: boolean;
  agendamento: {
    id: number;
    descricao: string;
    valor: number;
    tipo: 'pagamento' | 'recebimento';
    categoria?: string;
  };
}

export function ModalConfirmacaoPagamento({
  isOpen,
  onClose,
  onSuccess,
  isDark,
  agendamento,
}: ModalConfirmacaoPagamentoProps) {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [carteiraSelecionada, setCarteiraSelecionada] = useState<number | null>(null);
  const [valorPago, setValorPago] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setValorPago(agendamento.valor);
      setCarteiraSelecionada(null);
      carregarCarteiras();
    }
  }, [isOpen, agendamento]);

  const carregarCarteiras = async () => {
    try {
      const response = await api.buscarCarteiras();
      if (response.success && response.carteiras) {
        setCarteiras(response.carteiras);
        // Seleciona carteira padrão se houver
        const padrao = response.carteiras.find((c: Carteira) => c.padrao);
        if (padrao) {
          setCarteiraSelecionada(padrao.id);
        } else if (response.carteiras.length > 0) {
          setCarteiraSelecionada(response.carteiras[0].id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar carteiras:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!carteiraSelecionada) {
      showError('Selecione uma carteira/banco');
      return;
    }
    
    if (isNaN(valorPago) || valorPago <= 0) {
      showError('Valor inválido');
      return;
    }

    setLoading(true);
    try {
      // Atualiza status do agendamento para pago e passa informações para o backend criar a transação
      // O backend vai criar a transação automaticamente com as informações fornecidas
      await api.atualizarAgendamento(agendamento.id, { 
        status: 'pago',
        carteiraId: carteiraSelecionada,
        valorPago: valorPago,
      });
      
      showSuccess(
        agendamento.tipo === 'recebimento' 
          ? 'Recebimento registrado com sucesso!'
          : 'Pagamento registrado com sucesso!'
      );
      onSuccess();
      onClose();
    } catch (error: any) {
      showError(error.message || 'Erro ao registrar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`fixed inset-0 z-50 flex items-center justify-center p-4`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`w-full max-w-md rounded-xl shadow-xl ${
                isDark ? 'bg-slate-800' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className={`flex items-center justify-between p-6 border-b ${
                  isDark ? 'border-slate-700' : 'border-slate-200'
                }`}
              >
                <h2
                  className={`text-xl font-bold flex items-center gap-2 ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  <FaCheckCircle className={isDark ? 'text-green-400' : 'text-green-600'} size={20} />
                  {agendamento.tipo === 'recebimento' ? 'Confirmar Recebimento' : 'Confirmar Pagamento'}
                </h2>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? 'hover:bg-slate-700 text-slate-300'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <FaTimes size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Informações do Agendamento */}
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-1`}>
                    {agendamento.tipo === 'recebimento' ? 'Recebimento' : 'Pagamento'}
                  </p>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {agendamento.descricao}
                  </p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Valor agendado: {formatarMoeda(agendamento.valor)}
                  </p>
                </div>

                {/* Carteira/Banco */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 flex items-center gap-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    <FaWallet size={14} />
                    Carteira/Banco *
                  </label>
                  <select
                    value={carteiraSelecionada || ''}
                    onChange={(e) => setCarteiraSelecionada(parseInt(e.target.value))}
                    required
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      isDark
                        ? 'border-slate-600 bg-slate-700 text-white'
                        : 'border-slate-300 bg-white text-slate-900'
                    }`}
                  >
                    <option value="">Selecione uma carteira</option>
                    {carteiras.map((carteira) => (
                      <option key={carteira.id} value={carteira.id}>
                        {carteira.nome} {carteira.tipo ? `(${carteira.tipo === 'credito' ? 'Crédito' : 'Débito'})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Valor Pago */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    Valor {agendamento.tipo === 'recebimento' ? 'Recebido' : 'Pago'} (R$) *
                  </label>
                  <CurrencyInputCustom
                    id="valor-pago-input"
                    name="valorPago"
                    value={valorPago}
                    onChange={(novoValor) => {
                      setValorPago(novoValor);
                    }}
                    placeholder="R$ 0,00"
                    required
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      isDark
                        ? 'border-slate-600 bg-slate-700 text-white'
                        : 'border-slate-300 bg-white text-slate-900'
                    }`}
                  />
                  {valorPago !== agendamento.valor && (
                    <p className={`text-xs mt-1 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                      ⚠️ Valor diferente do agendado ({formatarMoeda(agendamento.valor)})
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isDark
                        ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2 ${
                      loading
                        ? 'bg-slate-400 cursor-not-allowed'
                        : isDark
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <FaCheckCircle size={14} />
                        Confirmar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
