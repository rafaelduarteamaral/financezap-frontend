import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import type { Agendamento } from '../config';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaMoneyBillWave, FaCheckCircle, FaTimesCircle, FaTrash, FaClock, FaPlus, FaEdit } from 'react-icons/fa';
import { AnimatedIcon } from './AnimatedIcon';
import { capitalize } from '../utils/capitalize';
import { ModalFormularioAgendamento } from './ModalFormularioAgendamento';
import { ModalConfirmacaoPagamento } from './ModalConfirmacaoPagamento';

interface AgendamentosProps {
  isDark: boolean;
}

export function Agendamentos({ isDark }: AgendamentosProps) {
  const { showSuccess, showError, confirm } = useToast();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendente' | 'pago' | 'cancelado'>('todos');
  const [modalAgendamentoAberto, setModalAgendamentoAberto] = useState(false);
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState<Agendamento | null>(null);
  const [modalConfirmacaoPagamentoAberto, setModalConfirmacaoPagamentoAberto] = useState(false);
  const [agendamentoParaPagar, setAgendamentoParaPagar] = useState<Agendamento | null>(null);
  const [categorias, setCategorias] = useState<string[]>(['outros']);

  const carregarAgendamentos = async () => {
    try {
      setLoading(true);
      const filtros: any = {};
      if (filtroStatus !== 'todos') {
        filtros.status = filtroStatus;
      }
      const response = await api.buscarAgendamentos(filtros);
      if (response.success) {
        setAgendamentos(response.agendamentos || []);
      }
    } catch (error: any) {
      // Erro silencioso
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarAgendamentos();
  }, [filtroStatus]);

  useEffect(() => {
    const carregarCategorias = async () => {
      try {
        const response = await api.buscarCategorias();
        if (response.success && response.categorias) {
          const nomesCategorias = response.categorias.map((cat: any) => cat.nome);
          setCategorias(['outros', ...nomesCategorias]);
        }
      } catch (error) {
        // Erro silencioso
      }
    };
    carregarCategorias();
  }, []);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarData = (data: string) => {
    try {
      const date = new Date(data + 'T00:00:00');
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return data;
    }
  };

  const handleAtualizarStatus = async (id: number, novoStatus: 'pendente' | 'pago' | 'cancelado') => {
    try {
      if (novoStatus === 'pago') {
        // Abre modal de confirmação de pagamento
        const agendamento = agendamentos.find(a => a.id === id);
        if (agendamento) {
          setAgendamentoParaPagar(agendamento);
          setModalConfirmacaoPagamentoAberto(true);
        }
      } else {
        // Para cancelado ou pendente, atualiza diretamente
        await api.atualizarAgendamento(id, { status: novoStatus });
        showSuccess('Status do agendamento atualizado com sucesso!');
        await carregarAgendamentos();
      }
    } catch (error: any) {
      showError('Erro ao atualizar agendamento: ' + error.message);
    }
  };

  const handleRemover = async (id: number) => {
    const confirmar = await confirm({
      title: 'Remover Agendamento',
      message: 'Tem certeza que deseja remover este agendamento?',
      type: 'danger',
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      onConfirm: () => {},
    });

    if (!confirmar) {
      return;
    }

    try {
      await api.removerAgendamento(id);
      showSuccess('Agendamento removido com sucesso!');
      await carregarAgendamentos();
    } catch (error: any) {
      showError('Erro ao remover agendamento: ' + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return isDark ? 'text-green-400' : 'text-green-600';
      case 'pendente':
        return isDark ? 'text-gold' : 'text-gold-dark';
      case 'cancelado':
        return isDark ? 'text-red-400' : 'text-red-600';
      default:
        return isDark ? 'text-slate-400' : 'text-slate-600';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'pago':
        return isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200';
      case 'pendente':
        return isDark ? 'bg-gold-dark/20 border-gold-dark' : 'bg-gold-light/30 border-gold';
      case 'cancelado':
        return isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200';
      default:
        return isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
    }
  };

  const agendamentosPendentes = agendamentos.filter(a => a.status === 'pendente');
  const agendamentosPagos = agendamentos.filter(a => a.status === 'pago');
  const agendamentosCancelados = agendamentos.filter(a => a.status === 'cancelado');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-xl shadow-sm p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className={`text-2xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <AnimatedIcon>
                <FaCalendarAlt className="text-primary-600" size={28} />
              </AnimatedIcon>
              Agendamentos
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Gerencie seus pagamentos e recebimentos agendados
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <motion.button
              onClick={() => {
                setAgendamentoParaEditar(null);
                setModalAgendamentoAberto(true);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white ${
                isDark ? 'bg-primary-500 hover:bg-primary-600' : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              <FaPlus size={14} />
              Novo Agendamento
            </motion.button>

            {/* Filtros */}
            <div className="flex gap-2 flex-wrap">
            {(['todos', 'pendente', 'pago', 'cancelado'] as const).map((status) => (
              <motion.button
                key={status}
                onClick={() => setFiltroStatus(status)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroStatus === status
                    ? isDark
                      ? 'bg-primary-500 text-white'
                      : 'bg-primary-600 text-white'
                    : isDark
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {status === 'todos' ? 'Todos' : status === 'pendente' ? 'Pendentes' : status === 'pago' ? 'Pagos' : 'Cancelados'}
              </motion.button>
            ))}
            </div>
          </div>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-2">
              <FaClock className={isDark ? 'text-gold' : 'text-gold-dark'} size={20} />
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Pendentes</span>
            </div>
            <p className={`text-2xl font-bold mt-2 ${isDark ? 'text-gold' : 'text-gold-dark'}`}>
              {agendamentosPendentes.length}
            </p>
          </div>
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-2">
              <FaCheckCircle className={isDark ? 'text-green-400' : 'text-green-600'} size={20} />
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Pagos</span>
            </div>
            <p className={`text-2xl font-bold mt-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              {agendamentosPagos.length}
            </p>
          </div>
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-2">
              <FaTimesCircle className={isDark ? 'text-red-400' : 'text-red-600'} size={20} />
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Cancelados</span>
            </div>
            <p className={`text-2xl font-bold mt-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
              {agendamentosCancelados.length}
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Agendamentos */}
      {loading ? (
        <div className={`rounded-xl shadow-sm p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <p className={`text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Carregando agendamentos...</p>
        </div>
      ) : agendamentos.length === 0 ? (
        <div className={`rounded-xl shadow-sm p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <p className={`text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Nenhum agendamento encontrado.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Agrupar agendamentos recorrentes */}
          {(() => {
            // Separa agendamentos recorrentes dos simples
            const agendamentosRecorrentes = agendamentos.filter(a => a.recorrente && a.agendamentoPaiId);
            const agendamentosPais = agendamentos.filter(a => a.recorrente && !a.agendamentoPaiId);
            const agendamentosSimples = agendamentos.filter(a => !a.recorrente);
            
            // Agrupa recorrentes por agendamentoPaiId
            const gruposRecorrentes = new Map<number, Agendamento[]>();
            
            // Primeiro, adiciona os agendamentos pais
            agendamentosPais.forEach(pai => {
              gruposRecorrentes.set(pai.id, [pai]);
            });
            
            // Depois, adiciona os filhos aos grupos
            agendamentosRecorrentes.forEach(ag => {
              const paiId = ag.agendamentoPaiId!;
              if (gruposRecorrentes.has(paiId)) {
                gruposRecorrentes.get(paiId)!.push(ag);
              } else {
                // Se o pai não foi encontrado, cria um grupo novo
                gruposRecorrentes.set(paiId, [ag]);
              }
            });
            
            // Ordena cada série por parcelaAtual
            gruposRecorrentes.forEach((serie) => {
              serie.sort((a, b) => {
                const parcelaA = a.parcelaAtual || 0;
                const parcelaB = b.parcelaAtual || 0;
                return parcelaA - parcelaB;
              });
            });
            
            return (
              <>
                {/* Séries Recorrentes */}
                {Array.from(gruposRecorrentes.entries()).map(([paiId, serie]) => {
                  const agendamentoPai = serie.find(a => a.id === paiId) || serie[0];
                  const pendentes = serie.filter(a => a.status === 'pendente');
                  const pagos = serie.filter(a => a.status === 'pago');
                  const proximaParcela = pendentes.sort((a, b) => {
                    const dataA = new Date(a.dataAgendamento).getTime();
                    const dataB = new Date(b.dataAgendamento).getTime();
                    return dataA - dataB;
                  })[0];
                  
                  return (
                    <div key={paiId} className={`rounded-xl shadow-sm p-4 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {agendamentoPai.descricao}
                          </h3>
                          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {agendamentoPai.totalParcelas} parcelas • {pagos.length} pagas • {pendentes.length} pendentes
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          proximaParcela 
                            ? isDark ? 'bg-blue-900/30 text-blue-400 border border-blue-800' : 'bg-blue-50 text-blue-600 border border-blue-200'
                            : isDark ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-green-50 text-green-600 border border-green-200'
                        }`}>
                          {proximaParcela ? `Próxima: Parcela ${proximaParcela.parcelaAtual}` : 'Todas pagas'}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {serie.slice(0, 6).map((ag) => (
                          <div
                            key={ag.id}
                            className={`p-3 rounded-lg border ${
                              ag.id === proximaParcela?.id
                                ? isDark ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
                                : isDark ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-xs font-medium ${
                                ag.id === proximaParcela?.id
                                  ? isDark ? 'text-blue-400' : 'text-blue-600'
                                  : isDark ? 'text-slate-400' : 'text-slate-600'
                              }`}>
                                Parcela {ag.parcelaAtual}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                ag.status === 'pago'
                                  ? isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                                  : ag.status === 'cancelado'
                                  ? isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
                                  : isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {ag.status === 'pago' ? 'Pago' : ag.status === 'cancelado' ? 'Cancelado' : 'Pendente'}
                              </span>
                            </div>
                            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {formatarMoeda(ag.valor)}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                              {formatarData(ag.dataAgendamento)}
                            </p>
                            {ag.id === proximaParcela?.id && ag.status === 'pendente' && (
                              <motion.button
                                onClick={() => handleAtualizarStatus(ag.id, 'pago')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`mt-2 w-full px-2 py-1 rounded text-xs font-medium transition-colors ${
                                  isDark
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                              >
                                Pagar Agora
                              </motion.button>
                            )}
                          </div>
                        ))}
                      </div>
                      {serie.length > 6 && (
                        <p className={`text-xs mt-3 text-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          ... e mais {serie.length - 6} parcela(s)
                        </p>
                      )}
                    </div>
                  );
                })}
                
                {/* Agendamentos Simples */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agendamentosSimples.map((agendamento) => (
            <motion.div
              key={agendamento.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl shadow-sm p-4 border ${getStatusBg(agendamento.status)} relative`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1">
                  <AnimatedIcon>
                    <FaMoneyBillWave className={isDark ? 'text-primary-400' : 'text-primary-600'} size={18} />
                  </AnimatedIcon>
                  <h3 className={`text-base font-semibold flex-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {capitalize(agendamento.descricao)}
                  </h3>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(agendamento.status)} ${
                    isDark ? 'bg-slate-700' : 'bg-slate-100'
                  }`}
                >
                  {agendamento.status === 'pendente' ? 'Pendente' : agendamento.status === 'pago' ? 'Pago' : 'Cancelado'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Valor:</p>
                  <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatarMoeda(agendamento.valor)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Data:</p>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatarData(agendamento.dataAgendamento)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Tipo:</p>
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {agendamento.tipo === 'pagamento' ? 'Pagamento' : 'Recebimento'}
                  </p>
                </div>
                {agendamento.recorrente && agendamento.parcelaAtual && agendamento.totalParcelas && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Parcela:</p>
                    <p className={`text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      {agendamento.parcelaAtual} de {agendamento.totalParcelas}
                    </p>
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                {agendamento.status === 'pendente' && (
                  <>
                    <motion.button
                      onClick={() => {
                        setAgendamentoParaEditar(agendamento);
                        setModalAgendamentoAberto(true);
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm ${
                        isDark
                          ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/30 border border-blue-800'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      <FaEdit size={12} />
                      Editar
                    </motion.button>
                    <motion.button
                      onClick={() => handleAtualizarStatus(agendamento.id, 'pago')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm ${
                        isDark
                          ? 'bg-brand-dark hover:bg-brand text-white'
                          : 'bg-brand hover:bg-brand-dark text-white'
                      }`}
                    >
                      <FaCheckCircle size={12} />
                      Marcar como Pago
                    </motion.button>
                    <motion.button
                      onClick={() => handleAtualizarStatus(agendamento.id, 'cancelado')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm ${
                        isDark
                          ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30 border border-red-800'
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      <FaTimesCircle size={12} />
                      Cancelar
                    </motion.button>
                  </>
                )}
                <motion.button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemover(agendamento.id);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 relative z-10 cursor-pointer ${
                    isDark
                      ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }`}
                  type="button"
                >
                  <FaTrash size={12} />
                  Remover
                </motion.button>
              </div>
            </motion.div>
          ))}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Modal de Novo/Editar Agendamento */}
      <ModalFormularioAgendamento
        isOpen={modalAgendamentoAberto}
        onClose={() => {
          setModalAgendamentoAberto(false);
          setAgendamentoParaEditar(null);
        }}
        onSuccess={() => {
          carregarAgendamentos();
          setAgendamentoParaEditar(null);
        }}
        isDark={isDark}
        categorias={categorias}
        agendamentoParaEditar={agendamentoParaEditar}
      />

      {/* Modal de Confirmação de Pagamento */}
      {agendamentoParaPagar && (
        <ModalConfirmacaoPagamento
          isOpen={modalConfirmacaoPagamentoAberto}
          onClose={() => {
            setModalConfirmacaoPagamentoAberto(false);
            setAgendamentoParaPagar(null);
          }}
          onSuccess={() => {
            carregarAgendamentos();
            setAgendamentoParaPagar(null);
          }}
          isDark={isDark}
          agendamento={{
            id: agendamentoParaPagar.id,
            descricao: agendamentoParaPagar.descricao,
            valor: agendamentoParaPagar.valor,
            tipo: agendamentoParaPagar.tipo,
            categoria: agendamentoParaPagar.categoria,
          }}
        />
      )}
    </div>
  );
}

