import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaPlus } from 'react-icons/fa';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface ModalFormularioTransacaoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isDark: boolean;
  categorias: string[];
}

export function ModalFormularioTransacao({
  isOpen,
  onClose,
  onSuccess,
  isDark,
  categorias,
}: ModalFormularioTransacaoProps) {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [carteiras, setCarteiras] = useState<Array<{ id: number; nome: string; padrao: boolean }>>([]);
  const [carteiraPadrao, setCarteiraPadrao] = useState<number | null>(null);
  
  // Função para obter data/hora atual no formato datetime-local (YYYY-MM-DDTHH:mm)
  const getDataHoraAtual = () => {
    const agora = new Date();
    // Ajusta para o fuso horário local
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const hora = String(agora.getHours()).padStart(2, '0');
    const minuto = String(agora.getMinutes()).padStart(2, '0');
    return `${ano}-${mes}-${dia}T${hora}:${minuto}`;
  };

  // Função para converter datetime-local para formato pt-BR (igual WhatsApp)
  const formatarDataHoraParaBackend = (dataHoraLocal: string): string => {
    if (!dataHoraLocal) return new Date().toLocaleString('pt-BR');
    const data = new Date(dataHoraLocal);
    return data.toLocaleString('pt-BR');
  };

  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    categoria: 'outros',
    tipo: 'saida' as 'entrada' | 'saida',
    metodo: 'debito' as 'credito' | 'debito',
    dataHora: getDataHoraAtual(),
    carteiraId: null as number | null,
  });

  // Carrega carteiras quando o modal abre
  useEffect(() => {
    if (isOpen) {
      const carregarCarteiras = async () => {
        try {
          const response = await api.buscarCarteiras();
          if (response.success && response.carteiras) {
            const carteirasAtivas = response.carteiras.filter((c: any) => c.ativo);
            setCarteiras(carteirasAtivas);
            
            // Encontra a carteira padrão
            const padrao = carteirasAtivas.find((c: any) => c.padrao);
            if (padrao) {
              setCarteiraPadrao(padrao.id);
              setFormData(prev => ({ ...prev, carteiraId: padrao.id }));
            } else if (carteirasAtivas.length > 0) {
              // Se não houver padrão, usa a primeira
              setCarteiraPadrao(carteirasAtivas[0].id);
              setFormData(prev => ({ ...prev, carteiraId: carteirasAtivas[0].id }));
            }
          }
        } catch (error) {
          console.error('Erro ao carregar carteiras:', error);
        }
      };
      carregarCarteiras();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens com data/hora atual
      // Garante que a categoria padrão existe na lista
      const categoriaPadrao = categorias && categorias.length > 0 && categorias.includes('outros') 
        ? 'outros' 
        : (categorias && categorias.length > 0 ? categorias[0] : 'outros');
      
      setFormData({
        descricao: '',
        valor: '',
        categoria: categoriaPadrao,
        tipo: 'saida',
        metodo: 'debito',
        dataHora: getDataHoraAtual(),
        carteiraId: carteiraPadrao,
      });
    }
  }, [isOpen, categorias]);

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

    setLoading(true);
    try {
      // Converte dataHora do formato datetime-local para formato pt-BR (igual WhatsApp)
      const dataHoraFormatada = formatarDataHoraParaBackend(formData.dataHora);
      // Extrai apenas a data (YYYY-MM-DD) da dataHora
      const dataFormatada = formData.dataHora ? formData.dataHora.split('T')[0] : new Date().toISOString().split('T')[0];
      
      const dadosTransacao = {
        descricao: formData.descricao.trim(),
        valor: parseFloat(formData.valor),
        categoria: formData.categoria,
        tipo: formData.tipo,
        metodo: formData.metodo,
        data: dataFormatada,
        dataHora: dataHoraFormatada,
        carteiraId: formData.carteiraId,
      };
      
      console.log('📤 Enviando transação:', dadosTransacao);
      
      const response = await api.criarTransacao(dadosTransacao);
      
      console.log('✅ Transação criada com sucesso:', response);
      console.log('📋 ID da transação criada:', response.transacao?.id);
      
      showSuccess('Transação criada com sucesso!');
      
      // Aguarda um pouco antes de chamar onSuccess para garantir que o backend processou
      await new Promise(resolve => setTimeout(resolve, 300));
      
      onSuccess();
      onClose();
    } catch (error: any) {
      showError(error.message || 'Erro ao criar transação');
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
                  Nova Transação
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
                    placeholder="Ex: Compra no supermercado"
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

                {/* Tipo e Método */}
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
                          tipo: e.target.value as 'entrada' | 'saida',
                        })
                      }
                      required
                      className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        isDark
                          ? 'border-slate-600 bg-slate-700 text-white'
                          : 'border-slate-300 bg-white text-slate-900'
                      }`}
                    >
                      <option value="entrada">Entrada</option>
                      <option value="saida">Saída</option>
                    </select>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      Método *
                    </label>
                    <select
                      value={formData.metodo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          metodo: e.target.value as 'credito' | 'debito',
                        })
                      }
                      required
                      className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        isDark
                          ? 'border-slate-600 bg-slate-700 text-white'
                          : 'border-slate-300 bg-white text-slate-900'
                      }`}
                    >
                      <option value="debito">Débito</option>
                      <option value="credito">Crédito</option>
                    </select>
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
                    {categorias && categorias.length > 0 ? (
                      categorias.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))
                    ) : (
                      <option value="outros">Outros</option>
                    )}
                  </select>
                </div>

                {/* Carteira */}
                {carteiras.length > 0 && (
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      Carteira
                    </label>
                    <select
                      value={formData.carteiraId || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, carteiraId: e.target.value ? parseInt(e.target.value) : null })
                      }
                      className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        isDark
                          ? 'border-slate-600 bg-slate-700 text-white'
                          : 'border-slate-300 bg-white text-slate-900'
                      }`}
                    >
                      {carteiras.map((carteira) => (
                        <option key={carteira.id} value={carteira.id}>
                          {carteira.nome} {carteira.padrao ? '(Padrão)' : ''}
                        </option>
                      ))}
                    </select>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Se não selecionar, será usada a carteira padrão
                    </p>
                  </div>
                )}

                {/* Data e Hora */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    Data e Hora
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.dataHora}
                    onChange={(e) =>
                      setFormData({ ...formData, dataHora: e.target.value })
                    }
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      isDark
                        ? 'border-slate-600 bg-slate-700 text-white'
                        : 'border-slate-300 bg-white text-slate-900'
                    }`}
                  />
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Padrão: data e hora atual
                  </p>
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

