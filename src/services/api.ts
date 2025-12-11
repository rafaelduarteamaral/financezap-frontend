import type { Filtros } from '../config';
import { API_BASE_URL } from '../config';

// Função auxiliar para obter token do localStorage
function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

// Função auxiliar para criar headers com autenticação
function getHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

export const api = {
  // Criar transação
  async criarTransacao(dados: {
    descricao: string;
    valor: number;
    categoria?: string;
    tipo: 'entrada' | 'saida';
    metodo: 'credito' | 'debito';
    dataHora?: string;
    data?: string;
    carteiraId?: number | null;
  }) {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/transacoes`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Excluir transação
  async excluirTransacao(id: number) {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/transacoes/${id}`, {
      method: 'DELETE',
      headers,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Buscar transações com filtros e paginação
  async buscarTransacoes(filtros?: Filtros & { page?: number; limit?: number }) {
    const params = new URLSearchParams();
    
    if (filtros?.dataInicio) params.append('dataInicio', filtros.dataInicio);
    if (filtros?.dataFim) params.append('dataFim', filtros.dataFim);
    if (filtros?.valorMin) params.append('valorMin', filtros.valorMin.toString());
    if (filtros?.valorMax) params.append('valorMax', filtros.valorMax.toString());
    if (filtros?.descricao) params.append('descricao', filtros.descricao);
    if (filtros?.categoria) params.append('categoria', filtros.categoria);
    if (filtros?.carteirasIds && filtros.carteirasIds.length > 0) {
      filtros.carteirasIds.forEach(id => params.append('carteirasIds', id.toString()));
    }
    if (filtros?.page) params.append('page', filtros.page.toString());
    if (filtros?.limit) params.append('limit', filtros.limit.toString());

    const headers = getHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/transacoes?${params.toString()}`, {
      headers,
    });
    
    if (response.status === 401) {
      // Token expirado ou inválido
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || 'Sessão expirada. Por favor, faça login novamente.';
      
      // Se o erro menciona que precisa fazer login novamente, limpa tudo
      if (errorMessage.includes('login novamente') || 
          errorMessage.includes('campo telefone não encontrado') ||
          errorMessage.includes('Token inválido')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_usuario');
        // Não força reload imediato - deixa o componente lidar com isso
      }
      
      throw new Error(errorMessage);
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Buscar estatísticas
  async buscarEstatisticas(filtros?: Filtros) {
    const params = new URLSearchParams();
    if (filtros?.dataInicio) params.append('dataInicio', filtros.dataInicio);
    if (filtros?.dataFim) params.append('dataFim', filtros.dataFim);
    if (filtros?.valorMin) params.append('valorMin', filtros.valorMin.toString());
    if (filtros?.valorMax) params.append('valorMax', filtros.valorMax.toString());
    if (filtros?.descricao) params.append('descricao', filtros.descricao);
    if (filtros?.categoria) params.append('categoria', filtros.categoria);
    if (filtros?.carteirasIds && filtros.carteirasIds.length > 0) {
      filtros.carteirasIds.forEach(id => params.append('carteirasIds', id.toString()));
    }

    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/estatisticas?${params.toString()}`, {
      headers,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Buscar estatísticas de CRÉDITO
  async buscarEstatisticasCredito(filtros?: Filtros) {
    const params = new URLSearchParams();
    if (filtros?.dataInicio) params.append('dataInicio', filtros.dataInicio);
    if (filtros?.dataFim) params.append('dataFim', filtros.dataFim);
    if (filtros?.valorMin) params.append('valorMin', filtros.valorMin.toString());
    if (filtros?.valorMax) params.append('valorMax', filtros.valorMax.toString());
    if (filtros?.descricao) params.append('descricao', filtros.descricao);
    if (filtros?.categoria) params.append('categoria', filtros.categoria);
    if (filtros?.carteirasIds && filtros.carteirasIds.length > 0) {
      filtros.carteirasIds.forEach(id => params.append('carteirasIds', id.toString()));
    }

    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/estatisticas-credito?${params.toString()}`, {
      headers,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Buscar gastos por dia (para gráfico)
  async buscarGastosPorDia(dias: number = 30) {
    const params = new URLSearchParams();
    params.append('dias', dias.toString());

    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/gastos-por-dia?${params.toString()}`, {
      headers,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Buscar gastos por dia de CRÉDITO (para gráfico)
  async buscarGastosPorDiaCredito(dias: number = 30) {
    const params = new URLSearchParams();
    params.append('dias', dias.toString());

    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/gastos-por-dia-credito?${params.toString()}`, {
      headers,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Listar telefones
  async listarTelefones() {
    const response = await fetch(`${API_BASE_URL}/api/telefones`);
    const data = await response.json();
    return data;
  },

  // Resumo por telefone
  async buscarResumo(telefone: string) {
    const response = await fetch(`${API_BASE_URL}/api/resumo/${encodeURIComponent(telefone)}`);
    const data = await response.json();
    return data;
  },

  // Autenticação - Solicitar código de verificação
  async solicitarCodigo(telefone: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/solicitar-codigo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ telefone }),
    });
    const data = await response.json();
    return data;
  },

  // Autenticação - Verificar código e fazer login
  async verificarCodigo(telefone: string, codigo: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/verificar-codigo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ telefone, codigo }),
    });
    const data = await response.json();
    return data;
  },

  // Autenticação - Cadastro de novo usuário
  async cadastro(telefone: string, nome: string, email?: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/cadastro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ telefone, nome, email }),
    });
    const data = await response.json();
    return data;
  },

  // Autenticação - DEPRECADO (mantido para compatibilidade)
  async login(telefone: string) {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ telefone }),
    });
    const data = await response.json();
    return data;
  },

  async verifyToken(token: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.status === 401) {
        return { success: false, error: 'Token inválido ou expirado' };
      }
      
      if (!response.ok) {
        // Se não for 401, pode ser erro de servidor (500, etc)
        // Retorna erro mas não remove o token automaticamente
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.error || `Erro ${response.status}` };
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      // Erro de rede - não remove o token, apenas retorna erro
      return { success: false, error: 'Erro de conexão. Verifique sua internet.' };
    }
  },

  // Enviar mensagem para salvar contato
  async enviarMensagemContato() {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/auth/enviar-contato`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Excluir todos os dados do usuário (LGPD)
  async excluirTodosDados() {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/auth/excluir-dados`, {
      method: 'DELETE',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Atualizar perfil do usuário
  async atualizarPerfil(dados: { nome: string; email?: string }) {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/auth/perfil`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Templates - Listar
  async listarTemplates() {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/templates`, {
      headers,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Templates - Criar
  async criarTemplate(dados: {
    nome: string;
    corPrimaria: string;
    corSecundaria: string;
    corDestaque: string;
    corFundo: string;
    corTexto: string;
  }) {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/templates`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Templates - Atualizar
  async atualizarTemplate(id: number, dados: {
    nome?: string;
    corPrimaria?: string;
    corSecundaria?: string;
    corDestaque?: string;
    corFundo?: string;
    corTexto?: string;
  }) {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/templates/${id}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Templates - Deletar
  async deletarTemplate(id: number) {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/templates/${id}`, {
      method: 'DELETE',
      headers,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Templates - Ativar
  async ativarTemplate(id: number) {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/templates/${id}/ativar`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Chat de IA para consultas financeiras
  async enviarMensagemChat(mensagem: string) {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mensagem }),
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Agendamentos - Criar
  async criarAgendamento(dados: {
    descricao: string;
    valor: number;
    dataAgendamento: string;
    tipo: 'pagamento' | 'recebimento';
    categoria?: string;
    recorrente?: boolean;
    totalParcelas?: number;
  }) {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/agendamentos`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Agendamentos - Listar
  async buscarAgendamentos(filtros?: { status?: string; dataInicio?: string; dataFim?: string }) {
    const params = new URLSearchParams();
    if (filtros?.status) params.append('status', filtros.status);
    if (filtros?.dataInicio) params.append('dataInicio', filtros.dataInicio);
    if (filtros?.dataFim) params.append('dataFim', filtros.dataFim);

    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/agendamentos?${params.toString()}`, {
      headers,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Agendamentos - Atualizar status
  async atualizarAgendamento(
    id: number, 
    dados: {
      status?: 'pendente' | 'pago' | 'cancelado';
      descricao?: string;
      valor?: number;
      dataAgendamento?: string;
      tipo?: 'pagamento' | 'recebimento';
      categoria?: string;
    }
  ) {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/agendamentos/${id}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Agendamentos - Remover
  async removerAgendamento(id: number) {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/agendamentos/${id}`, {
      method: 'DELETE',
      headers,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Categorias - Buscar todas
  async buscarCategorias() {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/categorias`, {
      headers,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Categorias - Criar
  async criarCategoria(dados: { nome: string; descricao?: string; cor?: string; tipo?: 'entrada' | 'saida' | 'ambos' }) {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/categorias`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Categorias - Atualizar
  async atualizarCategoria(id: number, dados: { nome?: string; descricao?: string; cor?: string; tipo?: 'entrada' | 'saida' | 'ambos' }) {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/categorias/${id}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Categorias - Remover
  async removerCategoria(id: number) {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/categorias/${id}`, {
      method: 'DELETE',
      headers,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Carteiras - Buscar todas
  async buscarCarteiras() {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/carteiras`, {
      headers,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Carteiras - Buscar padrão
  async buscarCarteiraPadrao() {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/carteiras/padrao`, {
      headers,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Carteiras - Criar
  async criarCarteira(dados: { 
    nome: string; 
    descricao?: string; 
    padrao?: boolean;
    tipo?: string;
    limiteCredito?: number;
    diaPagamento?: number;
  }) {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/carteiras`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Carteiras - Atualizar
  async atualizarCarteira(id: number, dados: { 
    nome?: string; 
    descricao?: string; 
    padrao?: boolean; 
    ativo?: boolean;
    tipo?: string;
    limiteCredito?: number;
    diaPagamento?: number;
  }) {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/carteiras/${id}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Carteiras - Definir como padrão
  async definirCarteiraPadrao(id: number) {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/carteiras/${id}/padrao`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },

  // Carteiras - Remover
  async removerCarteira(id: number) {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/carteiras/${id}`, {
      method: 'DELETE',
      headers,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_usuario');
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Sessão expirada. Por favor, faça login novamente.');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  },
};

