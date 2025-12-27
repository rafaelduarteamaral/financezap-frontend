import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FaTimes, FaDownload } from 'react-icons/fa';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

interface VisualizadorRelatorioProps {
  isOpen: boolean;
  onClose: () => void;
  dados: any;
  filtros: any;
  isDark: boolean;
}

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

export function VisualizadorRelatorio({
  isOpen,
  onClose,
  dados,
  filtros,
  isDark,
}: VisualizadorRelatorioProps) {
  const relatorioRef = useRef<HTMLDivElement>(null);
  const [gerandoPDF, setGerandoPDF] = useState(false);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarData = (data: string) => {
    try {
      return format(new Date(data), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return data;
    }
  };

  const gerarPDF = async () => {
    if (!relatorioRef.current) return;

    setGerandoPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let yPosition = margin;

      // Título
      pdf.setFontSize(20);
      pdf.setTextColor(16, 185, 129); // primary-500
      pdf.text('Relatório Financeiro', margin, yPosition);
      yPosition += 10;

      // Período
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      const periodoTexto = filtros.dataInicio && filtros.dataFim
        ? `${formatarData(filtros.dataInicio)} - ${formatarData(filtros.dataFim)}`
        : 'Período completo';
      pdf.text(`Período: ${periodoTexto}`, margin, yPosition);
      yPosition += 10;

      // Resumo
      pdf.setFontSize(14);
      pdf.text('Resumo Financeiro', margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(11);
      pdf.text(`Total de Entradas: ${formatarMoeda(dados.totalEntradas || 0)}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Total de Saídas: ${formatarMoeda(dados.totalSaidas || 0)}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Saldo: ${formatarMoeda((dados.totalEntradas || 0) - (dados.totalSaidas || 0))}`, margin, yPosition);
      yPosition += 10;

      // Captura os gráficos como imagens
      const graficos = relatorioRef.current.querySelectorAll('.grafico-container');
      
      for (let i = 0; i < graficos.length; i++) {
        const grafico = graficos[i] as HTMLElement;
        
        // Verifica se precisa de nova página
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = margin;
        }

        try {
          const canvas = await html2canvas(grafico, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
          });

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = contentWidth;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          // Verifica se precisa de nova página para o gráfico
          if (yPosition + imgHeight > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        } catch (error) {
          console.error('Erro ao capturar gráfico:', error);
        }
      }

      // Tabela de transações (top 20)
      if (dados.transacoes && dados.transacoes.length > 0) {
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFontSize(14);
        pdf.text('Principais Transações', margin, yPosition);
        yPosition += 8;

        pdf.setFontSize(9);
        const topTransacoes = dados.transacoes.slice(0, 20);
        
        topTransacoes.forEach((transacao: any, index: number) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = margin;
          }

          const descricao = (transacao.descricao || '').substring(0, 30);
          const valor = formatarMoeda(transacao.valor || 0);
          const data = transacao.dataHora ? formatarData(transacao.dataHora) : '-';
          const tipo = transacao.tipo === 'entrada' ? '+' : '-';

          pdf.text(`${index + 1}. ${descricao}`, margin, yPosition);
          pdf.text(`${tipo}${valor}`, margin + 100, yPosition);
          pdf.text(data, margin + 150, yPosition);
          yPosition += 6;
        });
      }

      // Salva o PDF
      const nomeArquivo = `relatorio-financeiro-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(nomeArquivo);

      setGerandoPDF(false);
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      setGerandoPDF(false);
      alert('Erro ao gerar PDF: ' + (error.message || 'Erro desconhecido'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full h-full max-w-7xl mx-auto ${isDark ? 'bg-slate-900' : 'bg-white'} rounded-lg shadow-2xl flex flex-col`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <div>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Relatório Financeiro
            </h2>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {filtros.dataInicio && filtros.dataFim
                ? `${formatarData(filtros.dataInicio)} - ${formatarData(filtros.dataFim)}`
                : 'Período completo'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={gerarPDF}
              disabled={gerandoPDF}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                gerandoPDF
                  ? 'bg-slate-400 cursor-not-allowed text-white'
                  : isDark ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'
              }`}
            >
              <FaDownload size={16} />
              {gerandoPDF ? 'Gerando PDF...' : 'Baixar PDF'}
            </motion.button>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
            >
              <FaTimes className={isDark ? 'text-white' : 'text-slate-900'} size={20} />
            </motion.button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6">
          <div ref={relatorioRef} className={`${isDark ? 'bg-slate-900' : 'bg-white'} p-6`}>
            {/* Resumo */}
            <div className="mb-8">
              <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Resumo Financeiro
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                  <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>Total de Entradas</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    {formatarMoeda(dados.totalEntradas || 0)}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>Total de Saídas</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    {formatarMoeda(dados.totalSaidas || 0)}
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${
                  (dados.totalEntradas || 0) - (dados.totalSaidas || 0) >= 0
                    ? isDark ? 'bg-primary-900/20 border border-primary-800' : 'bg-primary-50 border border-primary-200'
                    : isDark ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm ${
                    (dados.totalEntradas || 0) - (dados.totalSaidas || 0) >= 0
                      ? isDark ? 'text-primary-300' : 'text-primary-700'
                      : isDark ? 'text-red-300' : 'text-red-700'
                  }`}>Saldo</p>
                  <p className={`text-2xl font-bold ${
                    (dados.totalEntradas || 0) - (dados.totalSaidas || 0) >= 0
                      ? isDark ? 'text-primary-400' : 'text-primary-600'
                      : isDark ? 'text-red-400' : 'text-red-600'
                  }`}>
                    {formatarMoeda((dados.totalEntradas || 0) - (dados.totalSaidas || 0))}
                  </p>
                </div>
              </div>
            </div>

            {/* Gráficos */}
            {dados.gastosPorDia && dados.gastosPorDia.length > 0 && (
              <div className="mb-8 grafico-container">
                <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Fluxo Financeiro por Dia
                </h3>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`} style={{ height: '400px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dados.gastosPorDia}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#475569' : '#e2e8f0'} />
                      <XAxis 
                        dataKey="data" 
                        tick={{ fill: isDark ? '#cbd5e1' : '#64748b', fontSize: 12 }}
                        tickFormatter={(value) => {
                          try {
                            const date = new Date(value);
                            return format(date, 'dd/MM', { locale: ptBR });
                          } catch {
                            return value;
                          }
                        }}
                      />
                      <YAxis 
                        tick={{ fill: isDark ? '#cbd5e1' : '#64748b', fontSize: 12 }}
                        tickFormatter={(value) => {
                          if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
                          return `R$ ${value}`;
                        }}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatarMoeda(value)}
                        contentStyle={{
                          backgroundColor: isDark ? '#1e293b' : '#ffffff',
                          border: isDark ? '1px solid #475569' : '1px solid #e2e8f0',
                          borderRadius: '8px',
                          color: isDark ? '#cbd5e1' : '#1e293b'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="entradas" 
                        stroke="#10b981" 
                        strokeWidth={2} 
                        name="Entradas"
                        dot={{ fill: '#10b981', r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="saidas" 
                        stroke="#ef4444" 
                        strokeWidth={2} 
                        name="Saídas"
                        dot={{ fill: '#ef4444', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {dados.topCategorias && dados.topCategorias.length > 0 && (
              <div className="mb-8 grafico-container">
                <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Top Categorias
                </h3>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`} style={{ height: '400px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dados.topCategorias}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: any) => {
                          const { percent } = props;
                          if (percent === 0) return '';
                          return `${((percent || 0) * 100).toFixed(0)}%`;
                        }}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dados.topCategorias.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatarMoeda(value)}
                        contentStyle={{
                          backgroundColor: isDark ? '#1e293b' : '#ffffff',
                          border: isDark ? '1px solid #475569' : '1px solid #e2e8f0',
                          borderRadius: '8px',
                          color: isDark ? '#cbd5e1' : '#1e293b'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {dados.gastosPorCategoria && dados.gastosPorCategoria.length > 0 && (
              <div className="mb-8 grafico-container">
                <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Gastos por Categoria
                </h3>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`} style={{ height: '400px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dados.gastosPorCategoria}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#475569' : '#e2e8f0'} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: isDark ? '#cbd5e1' : '#64748b', fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis 
                        tick={{ fill: isDark ? '#cbd5e1' : '#64748b', fontSize: 12 }}
                        tickFormatter={(value) => {
                          if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
                          return `R$ ${value}`;
                        }}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatarMoeda(value)}
                        contentStyle={{
                          backgroundColor: isDark ? '#1e293b' : '#ffffff',
                          border: isDark ? '1px solid #475569' : '1px solid #e2e8f0',
                          borderRadius: '8px',
                          color: isDark ? '#cbd5e1' : '#1e293b'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Tabela de Transações */}
            {dados.transacoes && dados.transacoes.length > 0 && (
              <div className="mb-8">
                <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Transações ({dados.transacoes.length})
                </h3>
                <div className={`overflow-x-auto rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <th className={`px-4 py-3 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Data
                        </th>
                        <th className={`px-4 py-3 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Descrição
                        </th>
                        <th className={`px-4 py-3 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Categoria
                        </th>
                        <th className={`px-4 py-3 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Valor
                        </th>
                        <th className={`px-4 py-3 text-left text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          Tipo
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dados.transacoes.slice(0, 50).map((transacao: any, index: number) => (
                        <tr 
                          key={index}
                          className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-200'} hover:${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}
                        >
                          <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {transacao.dataHora ? formatarData(transacao.dataHora) : '-'}
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {transacao.descricao || '-'}
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {transacao.categoria || '-'}
                          </td>
                          <td className={`px-4 py-3 text-sm font-semibold ${
                            transacao.tipo === 'entrada'
                              ? isDark ? 'text-green-400' : 'text-green-600'
                              : isDark ? 'text-red-400' : 'text-red-600'
                          }`}>
                            {transacao.tipo === 'entrada' ? '+' : '-'}{formatarMoeda(transacao.valor || 0)}
                          </td>
                          <td className={`px-4 py-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {transacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

