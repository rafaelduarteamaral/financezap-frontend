import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FaWhatsapp, 
  FaFilter, 
  FaSync, 
  FaCalendarAlt,
  FaChevronDown,
  FaChevronUp,
  FaEye
} from 'react-icons/fa';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { VisualizadorRelatorio } from './VisualizadorRelatorio';
import { MultiSelectCarteiras } from './MultiSelectCarteiras';
import { capitalize } from '../utils/capitalize';

interface RelatoriosProps {
  isDark: boolean;
}

interface FiltrosRelatorio {
  dataInicio?: string;
  dataFim?: string;
  categoria?: string;
  tipo?: 'entrada' | 'saida' | 'todos';
  carteirasIds?: number[];
  valorMin?: number;
  valorMax?: number;
  metodo?: 'credito' | 'debito' | 'todos';
}

export function Relatorios({ isDark }: RelatoriosProps) {
  const { showSuccess, showError } = useToast();
  const [filtros, setFiltros] = useState<FiltrosRelatorio>({});
  const [filtrosExpandidos, setFiltrosExpandidos] = useState(false);
  const [periodoSelecionado, setPeriodoSelecionado] = useState<Date>(new Date());
  const [filtroRapidoAtivo, setFiltroRapidoAtivo] = useState<'hoje' | '7dias' | 'mes' | 'ano' | null>(null);
  const [todasCategorias, setTodasCategorias] = useState<string[]>([]);
  const [todasCarteiras, setTodasCarteiras] = useState<Array<{ id: number; nome: string; tipo?: string }>>([]);
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  const [relatorioAberto, setRelatorioAberto] = useState(false);
  const [dadosRelatorio, setDadosRelatorio] = useState<any>(null);

  // Carrega categorias e carteiras
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [categoriasRes, carteirasRes] = await Promise.all([
          api.buscarCategorias(),
          api.buscarCarteiras()
        ]);

        if (categoriasRes.success && categoriasRes.categorias) {
          const nomesCategorias = categoriasRes.categorias.map((cat: any) => cat.nome);
          setTodasCategorias(['todos', ...nomesCategorias.filter((cat: string) => cat !== 'outros'), 'outros']);
        }

        if (carteirasRes.success && carteirasRes.carteiras) {
          const carteirasFormatadas = carteirasRes.carteiras.map((c: any) => ({ 
            id: c.id, 
            nome: c.nome, 
            tipo: c.tipo 
          }));
          setTodasCarteiras(carteirasFormatadas);
        }
      } catch (error: any) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    carregarDados();
  }, []);

  const aplicarFiltroRapido = (tipo: 'hoje' | '7dias' | 'mes' | 'ano') => {
    const hoje = new Date();
    let dataInicio: Date;
    let dataFim: Date = hoje;

    switch (tipo) {
      case 'hoje':
        dataInicio = hoje;
        break;
      case '7dias':
        dataInicio = subDays(hoje, 7);
        break;
      case 'mes':
        dataInicio = startOfMonth(hoje);
        dataFim = endOfMonth(hoje);
        break;
      case 'ano':
        dataInicio = startOfYear(hoje);
        dataFim = endOfYear(hoje);
        break;
    }

    const novosFiltros = {
      ...filtros,
      dataInicio: format(dataInicio, 'yyyy-MM-dd'),
      dataFim: format(dataFim, 'yyyy-MM-dd'),
    };
    setFiltros(novosFiltros);
    setPeriodoSelecionado(hoje);
    setFiltroRapidoAtivo(tipo);
  };

  const navegarMes = (direcao: 'anterior' | 'proximo') => {
    const novoPeriodo = direcao === 'anterior' 
      ? subMonths(periodoSelecionado, 1)
      : addMonths(periodoSelecionado, 1);
    setPeriodoSelecionado(novoPeriodo);
    
    const inicioMes = startOfMonth(novoPeriodo);
    const fimMes = endOfMonth(novoPeriodo);
    
    const novosFiltros = {
      ...filtros,
      dataInicio: format(inicioMes, 'yyyy-MM-dd'),
      dataFim: format(fimMes, 'yyyy-MM-dd'),
    };
    setFiltros(novosFiltros);
    setFiltroRapidoAtivo(null);
  };

  const limparFiltros = () => {
    setFiltros({});
    setFiltroRapidoAtivo(null);
    setPeriodoSelecionado(new Date());
  };

  const gerarRelatorio = async () => {
    setGerandoRelatorio(true);
    try {
      const response = await api.gerarDadosRelatorio(filtros);
      
      if (response.success) {
        setDadosRelatorio(response.dados);
        setRelatorioAberto(true);
        showSuccess('Relatório gerado com sucesso!');
      } else {
        showError(response.error || 'Erro ao gerar relatório');
      }
    } catch (error: any) {
      showError('Erro ao gerar relatório: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setGerandoRelatorio(false);
    }
  };

  const enviarRelatorioWhatsApp = async () => {
    if (!dadosRelatorio) {
      showError('Gere um relatório primeiro');
      return;
    }

    setGerandoRelatorio(true);
    try {
      const response = await api.enviarRelatorioWhatsApp(filtros);
      
      if (response.success) {
        showSuccess('Relatório enviado via WhatsApp com sucesso!');
      } else {
        showError(response.error || 'Erro ao enviar relatório');
      }
    } catch (error: any) {
      showError('Erro ao enviar relatório: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setGerandoRelatorio(false);
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="mb-6">
          <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Relatórios Financeiros
          </h1>
          <p className={`text-sm sm:text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Gere relatórios detalhados com gráficos e análises das suas finanças
          </p>
        </div>

        {/* Filtros */}
        <div className={`rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 mb-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-[hsl(120,10%,96%)] border-slate-200'}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'}`}
              >
                <FaCalendarAlt size={16} />
                Período
              </motion.button>
              
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navegarMes('anterior')}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                >
                  <FaChevronDown className={`${isDark ? 'text-slate-300' : 'text-slate-700'} rotate-90`} size={16} />
                </motion.button>
                
                <span className={`text-base font-semibold min-w-[120px] text-center ${isDark ? 'text-white' : 'text-[hsl(220,15%,20%)]'}`}>
                  {format(periodoSelecionado, 'MMMM yyyy', { locale: ptBR })}
                </span>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navegarMes('proximo')}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                >
                  <FaChevronDown className={`${isDark ? 'text-slate-300' : 'text-slate-700'} -rotate-90`} size={16} />
                </motion.button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => aplicarFiltroRapido('hoje')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filtroRapidoAtivo === 'hoje'
                  ? isDark ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'
                  : isDark ? 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-300' : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-300'
              }`}
            >
              Hoje
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => aplicarFiltroRapido('7dias')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filtroRapidoAtivo === '7dias'
                  ? isDark ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'
                  : isDark ? 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-300' : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-300'
              }`}
            >
              7 Dias
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => aplicarFiltroRapido('mes')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filtroRapidoAtivo === 'mes'
                  ? isDark ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'
                  : isDark ? 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-300' : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-300'
              }`}
            >
              Este Mês
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => aplicarFiltroRapido('ano')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                filtroRapidoAtivo === 'ano'
                  ? isDark ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'
                  : isDark ? 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-300' : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-300'
              }`}
            >
              Este Ano
            </motion.button>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFiltrosExpandidos(!filtrosExpandidos)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtrosExpandidos
                  ? isDark ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'
                  : isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              <FaFilter size={14} />
              Filtros Avançados
              {filtrosExpandidos ? (
                <FaChevronUp size={12} />
              ) : (
                <FaChevronDown size={12} />
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={limparFiltros}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
            >
              <FaSync size={14} />
              Limpar
            </motion.button>
          </div>

          {/* Filtros Avançados */}
          {filtrosExpandidos && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-700"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={filtros.dataInicio || ''}
                    onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value || undefined })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'
                    }`}
                    style={isDark ? {} : { colorScheme: 'light' }}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Data Fim
                  </label>
                  <input
                    type="date"
                    value={filtros.dataFim || ''}
                    onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value || undefined })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'
                    }`}
                    style={isDark ? {} : { colorScheme: 'light' }}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Tipo
                  </label>
                  <select
                    value={filtros.tipo || 'todos'}
                    onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value as any || undefined })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'
                    }`}
                  >
                    <option value="todos">Todos</option>
                    <option value="entrada">Entradas</option>
                    <option value="saida">Saídas</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Categoria
                  </label>
                  <select
                    value={filtros.categoria || ''}
                    onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value || undefined })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'
                    }`}
                  >
                    <option value="">Todas</option>
                    {todasCategorias.map((cat) => (
                      <option key={cat} value={cat}>
                        {capitalize(cat)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Carteiras
                  </label>
                  <MultiSelectCarteiras
                    carteiras={todasCarteiras}
                    selectedIds={filtros.carteirasIds || []}
                    onChange={(selectedIds) => {
                      setFiltros({
                        ...filtros,
                        carteirasIds: selectedIds.length > 0 ? selectedIds : undefined,
                      });
                    }}
                    isDark={isDark}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Método
                  </label>
                  <select
                    value={filtros.metodo || 'todos'}
                    onChange={(e) => setFiltros({ ...filtros, metodo: e.target.value as any || undefined })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-slate-300 bg-white text-slate-900'
                    }`}
                  >
                    <option value="todos">Todos</option>
                    <option value="credito">Crédito</option>
                    <option value="debito">Débito</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Valor Mínimo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={filtros.valorMin || ''}
                    onChange={(e) => setFiltros({ ...filtros, valorMin: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-500' : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Valor Máximo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="999999.99"
                    value={filtros.valorMax || ''}
                    onChange={(e) => setFiltros({ ...filtros, valorMax: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      isDark ? 'border-slate-600 bg-slate-700 text-white placeholder-slate-500' : 'border-slate-300 bg-white text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Botões de Ação */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <motion.button
              onClick={gerarRelatorio}
              disabled={gerandoRelatorio}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium text-white ${
                gerandoRelatorio
                  ? 'bg-slate-400 cursor-not-allowed'
                  : isDark ? 'bg-primary-600 hover:bg-primary-700' : 'bg-primary-500 hover:bg-primary-600'
              }`}
            >
              <FaEye size={16} />
              {gerandoRelatorio ? 'Gerando...' : 'Visualizar Relatório'}
            </motion.button>

            <motion.button
              onClick={enviarRelatorioWhatsApp}
              disabled={gerandoRelatorio || !dadosRelatorio}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium ${
                gerandoRelatorio || !dadosRelatorio
                  ? 'bg-slate-400 cursor-not-allowed text-white'
                  : isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              <FaWhatsapp size={16} />
              Enviar via WhatsApp
            </motion.button>
          </div>
        </div>
      </div>

      {/* Modal de Visualização do Relatório */}
      {relatorioAberto && dadosRelatorio && (
        <VisualizadorRelatorio
          isOpen={relatorioAberto}
          onClose={() => setRelatorioAberto(false)}
          dados={dadosRelatorio}
          filtros={filtros}
          isDark={isDark}
        />
      )}
    </>
  );
}

