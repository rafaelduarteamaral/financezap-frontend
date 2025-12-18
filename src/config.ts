// Configuração da API
// Em produção: sempre usa a URL do worker na Cloudflare
// Em desenvolvimento: usa VITE_API_URL do .env ou localhost:3000
const PROD_API_URL = 'https://financezap.rafael-damaral.workers.dev';
const DEV_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_BASE_URL = import.meta.env.PROD ? PROD_API_URL : DEV_API_URL;


export type Transacao = {
  id?: number;
  telefone: string;
  descricao: string;
  valor: number;
  categoria: string;
  tipo?: 'entrada' | 'saida';
  metodo?: 'credito' | 'debito';
  dataHora: string;
  data: string;
  mensagemOriginal?: string;
  carteira?: {
    id: number;
    nome: string;
    tipo?: string;
  };
};

export type Estatisticas = {
  totalGasto: number;
  totalTransacoes: number;
  mediaGasto: number;
  maiorGasto: number;
  menorGasto: number;
  gastoHoje: number;
  gastoMes: number;
};

export type EstatisticasCredito = {
  totalGasto: number;
  totalTransacoes: number;
  mediaGasto: number;
  maiorGasto: number;
  menorGasto: number;
  gastoHoje: number;
  gastoMes: number;
  limiteUtilizado?: number;
  limiteDisponivel?: number;
};

export type Telefone = {
  telefone: string;
  total: number;
  totalGasto: number;
};

export type Filtros = {
  telefone?: string;
  dataInicio?: string;
  dataFim?: string;
  valorMin?: number;
  valorMax?: number;
  descricao?: string;
  categoria?: string;
  carteirasIds?: number[]; // Array de IDs de carteiras para filtrar múltiplas carteiras
};

export type Agendamento = {
  id: number;
  telefone: string;
  descricao: string;
  valor: number;
  dataAgendamento: string; // YYYY-MM-DD
  tipo: 'pagamento' | 'recebimento';
  status: 'pendente' | 'pago' | 'cancelado';
  categoria?: string;
  notificado: boolean;
  // Campos para agendamentos recorrentes
  recorrente?: boolean;
  totalParcelas?: number | null;
  parcelaAtual?: number | null;
  agendamentoPaiId?: number | null;
  criadoEm: string;
  atualizadoEm: string;
};

export type Categoria = {
  id: number;
  telefone: string | null;
  nome: string;
  descricao?: string | null;
  cor?: string | null;
  padrao: boolean;
  tipo: 'entrada' | 'saida' | 'ambos';
  criadoEm: string;
  atualizadoEm: string;
};

