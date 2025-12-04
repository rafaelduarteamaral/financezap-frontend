// Configuração da API
// Usa VITE_API_URL do .env ou fallback para localhost em desenvolvimento
// Para produção, configure VITE_API_URL no .env.production ou nas variáveis de ambiente do deploy
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Debug: mostra a URL da API sendo usada (remover em produção)
if (import.meta.env.DEV) {
  console.log('🔧 API_BASE_URL:', API_BASE_URL);
  console.log('🔧 VITE_API_URL do env:', import.meta.env.VITE_API_URL);
}

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

