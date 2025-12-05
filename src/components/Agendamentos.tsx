import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import type { Agendamento } from '../config';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaMoneyBillWave, FaCheckCircle, FaTimesCircle, FaTrash, FaClock } from 'react-icons/fa';
import { AnimatedIcon } from './AnimatedIcon';

interface AgendamentosProps {
  isDark: boolean;
}

export function Agendamentos({ isDark }: AgendamentosProps) {
  const { showSuccess, showError, confirm } = useToast();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendente' | 'pago' | 'cancelado'>('todos');

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
      console.error('❌ Erro ao carregar agendamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarAgendamentos();
  }, [filtroStatus]);

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
      await api.atualizarAgendamento(id, novoStatus);
      showSuccess('Status do agendamento atualizado com sucesso!');
      await carregarAgendamentos();
    } catch (error: any) {
      console.error('❌ Erro ao atualizar agendamento:', error);
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
      console.error('❌ Erro ao remover agendamento:', error);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agendamentos.map((agendamento) => (
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
                    {agendamento.descricao}
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
              </div>

              {/* Ações */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                {agendamento.status === 'pendente' && (
                  <>
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
      )}
    </div>
  );
}

