import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaPlus } from 'react-icons/fa';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface ModalFormularioAgendamentoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isDark: boolean;
  categorias: string[];
}

export function ModalFormularioAgendamento({
  isOpen,
  onClose,
  onSuccess,
  isDark,
  categorias,
}: ModalFormularioAgendamentoProps) {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    dataAgendamento: '',
    tipo: 'pagamento' as 'pagamento' | 'recebimento',
    categoria: 'outros',
  });

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      const hoje = new Date();
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);
      
      setFormData({
        descricao: '',
        valor: '',
        dataAgendamento: amanha.toISOString().split('T')[0],
        tipo: 'pagamento',
        categoria: 'outros',
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.descricao.trim()) {
      showError('Descrição é obrigatória');
      return;
    }
    
    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      showError('Valor inválido');
      return;
    }

    if (!formData.dataAgendamento) {
      showError('Data do agendamento é obrigatória');
      return;
    }

    setLoading(true);
    try {
      await api.criarAgendamento({
        descricao: formData.descricao.trim(),
        valor: parseFloat(formData.valor),
        dataAgendamento: formData.dataAgendamento,
        tipo: formData.tipo,
        categoria: formData.categoria,
      });
      
      showSuccess('Agendamento criado com sucesso!');
      onSuccess();
      onClose();
    } catch (error: any) {
      showError(error.message || 'Erro ao criar agendamento');
    } finally {
      setLoading(false);
    }
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
                  className={`text-xl font-bold ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Novo Agendamento
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
                {/* Descrição */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    Descrição *
                  </label>
                  <input
                    type="text"
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao: e.target.value })
                    }
                    required
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      isDark
                        ? 'border-slate-600 bg-slate-700 text-white'
                        : 'border-slate-300 bg-white text-slate-900'
                    }`}
                    placeholder="Ex: Pagamento de boleto"
                  />
                </div>

                {/* Valor */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.valor}
                    onChange={(e) =>
                      setFormData({ ...formData, valor: e.target.value })
                    }
                    required
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      isDark
                        ? 'border-slate-600 bg-slate-700 text-white'
                        : 'border-slate-300 bg-white text-slate-900'
                    }`}
                    placeholder="0.00"
                  />
                </div>

                {/* Tipo e Data */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      Tipo *
                    </label>
                    <select
                      value={formData.tipo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tipo: e.target.value as 'pagamento' | 'recebimento',
                        })
                      }
                      required
                      className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        isDark
                          ? 'border-slate-600 bg-slate-700 text-white'
                          : 'border-slate-300 bg-white text-slate-900'
                      }`}
                    >
                      <option value="pagamento">Pagamento</option>
                      <option value="recebimento">Recebimento</option>
                    </select>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      Data *
                    </label>
                    <input
                      type="date"
                      value={formData.dataAgendamento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dataAgendamento: e.target.value,
                        })
                      }
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        isDark
                          ? 'border-slate-600 bg-slate-700 text-white'
                          : 'border-slate-300 bg-white text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Categoria */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    Categoria
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) =>
                      setFormData({ ...formData, categoria: e.target.value })
                    }
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      isDark
                        ? 'border-slate-600 bg-slate-700 text-white'
                        : 'border-slate-300 bg-white text-slate-900'
                    }`}
                  >
                    {categorias.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
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
                        ? 'bg-primary-500 hover:bg-primary-600'
                        : 'bg-primary-600 hover:bg-primary-700'
                    }`}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <FaPlus size={14} />
                        Criar
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

