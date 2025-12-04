import type { Transacao, Estatisticas, Telefone, Filtros, Agendamento } from '../config';
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
    if (filtros?.page) params.append('page', filtros.page.toString());
    if (filtros?.limit) params.append('limit', filtros.limit.toString());

    const headers = getHeaders();
    console.log('🔐 Headers da requisição:', { ...headers, Authorization: headers.Authorization ? 'Bearer ***' : 'não enviado' });
    
    const response = await fetch(`${API_BASE_URL}/api/transacoes?${params.toString()}`, {
      headers,
    });
    
    console.log('📥 Resposta da API:', response.status, response.statusText);
    
    if (response.status === 401) {
      // Token expirado ou inválido
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
    console.log('✅ Dados recebidos:', { total: data.total, transacoes: data.transacoes?.length || 0 });
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
    const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (response.status === 401) {
      return { success: false, error: 'Token inválido ou expirado' };
    }
    
    const data = await response.json();
    return data;
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
  async atualizarAgendamento(id: number, status: 'pendente' | 'pago' | 'cancelado') {
    const headers = getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/agendamentos/${id}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
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
};

