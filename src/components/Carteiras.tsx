import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { motion } from 'framer-motion';
import { FaWallet, FaPlus, FaEdit, FaTrash, FaStar, FaStarOfLife } from 'react-icons/fa';
import { AnimatedIcon } from './AnimatedIcon';
import { CurrencyInputCustom } from './CurrencyInputCustom';

interface Carteira {
  id: number;
  nome: string;
  descricao?: string | null;
  tipo?: string; // "debito" ou "credito"
  limiteCredito?: number | null;
  diaPagamento?: number | null;
  padrao: boolean;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

interface CarteirasProps {
  isDark: boolean;
}

export function Carteiras({ isDark }: CarteirasProps) {
  const { showSuccess, showError, confirm } = useToast();
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<Carteira | null>(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: 'debito' as 'debito' | 'credito',
    limiteCredito: 0 as number,
    diaPagamento: '' as string | number,
    padrao: false,
  });

  const carregarCarteiras = async () => {
    try {
      setLoading(true);
      const response = await api.buscarCarteiras();
      if (response.success) {
        setCarteiras(response.carteiras || []);
      }
    } catch (error: any) {
      showError('Erro ao carregar carteiras: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarCarteiras();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      showError('Nome da carteira é obrigatório');
      return;
    }

    // Validações para carteira de crédito
    if (formData.tipo === 'credito') {
      if (!formData.limiteCredito || formData.limiteCredito <= 0) {
        showError('Limite de crédito é obrigatório e deve ser maior que zero');
        return;
      }

      const diaPagamento = typeof formData.diaPagamento === 'string'
        ? parseInt(formData.diaPagamento)
        : formData.diaPagamento;

      if (!diaPagamento || diaPagamento < 1 || diaPagamento > 31) {
        showError('Dia de pagamento deve ser entre 1 e 31');
        return;
      }
    }

    try {
      const dadosEnvio = {
        nome: formData.nome,
        descricao: formData.descricao || undefined,
        tipo: formData.tipo,
        padrao: formData.padrao,
        ...(formData.tipo === 'credito' && {
          limiteCredito: formData.limiteCredito,
          diaPagamento: typeof formData.diaPagamento === 'string'
            ? parseInt(formData.diaPagamento)
            : formData.diaPagamento,
        }),
      };

      if (editando) {
        await api.atualizarCarteira(editando.id, dadosEnvio);
        showSuccess('Carteira atualizada com sucesso!');
      } else {
        await api.criarCarteira(dadosEnvio);
        showSuccess('Carteira criada com sucesso!');
      }
      
      setMostrarForm(false);
      setEditando(null);
      setFormData({ 
        nome: '', 
        descricao: '', 
        tipo: 'debito',
        limiteCredito: 0,
        diaPagamento: '',
        padrao: false 
      });
      await carregarCarteiras();
    } catch (error: any) {
      showError('Erro ao salvar carteira: ' + error.message);
    }
  };

  const handleEditar = (carteira: Carteira) => {
    setEditando(carteira);
    setFormData({
      nome: carteira.nome,
      descricao: carteira.descricao || '',
      tipo: (carteira.tipo || 'debito') as 'debito' | 'credito',
      limiteCredito: carteira.limiteCredito || 0,
      diaPagamento: carteira.diaPagamento || '',
      padrao: carteira.padrao,
    });
    setMostrarForm(true);
  };

  const handleDefinirPadrao = async (id: number) => {
    try {
      await api.definirCarteiraPadrao(id);
      showSuccess('Carteira definida como padrão!');
      await carregarCarteiras();
    } catch (error: any) {
      showError('Erro ao definir carteira padrão: ' + error.message);
    }
  };

  const handleRemover = async (id: number, padrao: boolean) => {
    const confirmar = await confirm({
      title: 'Remover Carteira',
      message: padrao 
        ? 'Esta é a carteira padrão. Tem certeza que deseja removê-la?'
        : 'Tem certeza que deseja remover esta carteira?',
      type: 'danger',
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      onConfirm: () => {},
    });

    if (!confirmar) {
      return;
    }

    try {
      await api.removerCarteira(id);
      showSuccess('Carteira removida com sucesso!');
      await carregarCarteiras();
    } catch (error: any) {
      showError('Erro ao remover carteira: ' + error.message);
    }
  };

  const carteirasAtivas = carteiras.filter(c => c.ativo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-xl shadow-sm p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className={`text-2xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <AnimatedIcon>
                <FaWallet className="text-primary-600" size={28} />
              </AnimatedIcon>
              Carteiras
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Gerencie suas carteiras de dinheiro
            </p>
          </div>

          {!mostrarForm && (
            <motion.button
              onClick={() => {
                setEditando(null);
                setFormData({ 
                  nome: '', 
                  descricao: '', 
                  tipo: 'debito',
                  limiteCredito: 0,
                  diaPagamento: '',
                  padrao: false 
                });
                setMostrarForm(true);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm ${
                isDark
                  ? 'bg-brand-dark hover:bg-brand text-white'
                  : 'bg-brand hover:bg-brand-dark text-white'
              }`}
            >
              <FaPlus size={14} />
              Nova Carteira
            </motion.button>
          )}
        </div>
      </div>

      {/* Formulário */}
      {mostrarForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl shadow-sm p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
        >
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {editando ? 'Editar Carteira' : 'Nova Carteira'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Nome *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'
                }`}
                required
                placeholder="Ex: Carteira Principal, Poupança, etc."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'
                }`}
                rows={3}
                placeholder="Descrição opcional da carteira"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Tipo de Carteira *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => {
                  const novoTipo = e.target.value as 'debito' | 'credito';
                  setFormData({ 
                    ...formData, 
                    tipo: novoTipo,
                    // Limpa campos de crédito se mudar para débito
                    ...(novoTipo === 'debito' && { limiteCredito: 0, diaPagamento: '' })
                  });
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'
                }`}
                required
              >
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
              </select>
            </div>

            {formData.tipo === 'credito' && (
              <>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Limite de Crédito *
                  </label>
                  <CurrencyInputCustom
                    id="limite-credito-input"
                    name="limiteCredito"
                    value={formData.limiteCredito}
                    onChange={(novoValor: number) => {
                      setFormData({ ...formData, limiteCredito: novoValor });
                    }}
                    placeholder="R$ 0,00"
                    required={formData.tipo === 'credito'}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Dia de Pagamento da Fatura *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.diaPagamento}
                    onChange={(e) => setFormData({ ...formData, diaPagamento: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'
                    }`}
                    required={formData.tipo === 'credito'}
                    placeholder="Dia do mês (1-31)"
                  />
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Dia do mês em que a fatura vence
                  </p>
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="padrao"
                checked={formData.padrao}
                onChange={(e) => setFormData({ ...formData, padrao: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <label htmlFor="padrao" className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Definir como carteira padrão
              </label>
            </div>

            <div className="flex gap-2">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${
                  isDark
                    ? 'bg-brand-dark hover:bg-brand text-white'
                    : 'bg-brand hover:bg-brand-dark text-white'
                }`}
              >
                {editando ? 'Atualizar' : 'Criar'}
              </motion.button>
              <motion.button
                type="button"
                onClick={() => {
                  setMostrarForm(false);
                  setEditando(null);
                  setFormData({ 
                    nome: '', 
                    descricao: '', 
                    tipo: 'debito',
                    limiteCredito: 0,
                    diaPagamento: '',
                    padrao: false 
                  });
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                Cancelar
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Lista de Carteiras */}
      {loading ? (
        <div className={`rounded-xl shadow-sm p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <p className={`text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Carregando carteiras...</p>
        </div>
      ) : carteirasAtivas.length === 0 ? (
        <div className={`rounded-xl shadow-sm p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <p className={`text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Nenhuma carteira cadastrada. Crie sua primeira carteira!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {carteirasAtivas.map((carteira) => (
            <motion.div
              key={carteira.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl shadow-sm p-4 border ${
                carteira.padrao
                  ? isDark
                    ? 'bg-primary-900/20 border-primary-500'
                    : 'bg-primary-50 border-primary-500'
                  : isDark
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <FaWallet className={carteira.padrao ? 'text-primary-500' : 'text-slate-400'} size={20} />
                  <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {carteira.nome}
                  </h4>
                  {carteira.padrao && (
                    <FaStar className="text-primary-500" size={14} title="Carteira Padrão" />
                  )}
                </div>
              </div>
              
              {carteira.descricao && (
                <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {carteira.descricao}
                </p>
              )}

              <div className="mb-3 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    carteira.tipo === 'credito'
                      ? isDark ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
                      : isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {carteira.tipo === 'credito' ? 'Crédito' : 'Débito'}
                  </span>
                </div>
                {carteira.tipo === 'credito' && carteira.limiteCredito && (
                  <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span className="font-medium">Limite:</span> R$ {carteira.limiteCredito.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )}
                {carteira.tipo === 'credito' && carteira.diaPagamento && (
                  <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <span className="font-medium">Vencimento:</span> Dia {carteira.diaPagamento}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                {!carteira.padrao && (
                  <motion.button
                    onClick={() => handleDefinirPadrao(carteira.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      isDark
                        ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    title="Definir como padrão"
                  >
                    <FaStarOfLife size={10} className="inline mr-1" />
                    Padrão
                  </motion.button>
                )}
                <motion.button
                  onClick={() => handleEditar(carteira)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isDark
                      ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  title="Editar"
                >
                  <FaEdit size={10} />
                </motion.button>
                <motion.button
                  onClick={() => handleRemover(carteira.id, carteira.padrao)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isDark
                      ? 'bg-red-900/20 hover:bg-red-900/30 text-red-400'
                      : 'bg-red-50 hover:bg-red-100 text-red-600'
                  }`}
                  title="Remover"
                >
                  <FaTrash size={10} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
