import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api';

interface Usuario {
  telefone: string;
  nome?: string;
  email?: string;
  totalTransacoes?: number;
  totalGasto?: number;
  primeiraTransacao?: string;
  ultimaTransacao?: string;
  status?: string;
  plano?: string | null; // 'mensal', 'trimestral', 'anual' ou null
  trialExpiraEm?: string;
  diasRestantesTrial?: number | null;
}

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  login: (telefone: string, token?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  atualizarUsuario: (dados: Partial<Usuario>) => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica se há token salvo
    const savedToken = localStorage.getItem('auth_token');
    const savedUsuario = localStorage.getItem('auth_usuario');

    if (savedToken && savedUsuario) {
      // Primeiro, define o token e usuário do localStorage para manter a sessão
      // Isso evita logout imediato se a verificação falhar temporariamente
      setToken(savedToken);
      try {
        const usuarioParsed = JSON.parse(savedUsuario);
        setUsuario(usuarioParsed);
      } catch (e) {
        // Erro silencioso
      }
      
      // Depois, verifica se o token JWT ainda é válido (em background)
      // E recarrega os dados do perfil do servidor
      // Mas não bloqueia a UI enquanto verifica
      api.verifyToken(savedToken)
        .then((data) => {
          if (data.success && data.usuario) {
            // Token válido - atualiza dados com informações do servidor
            setUsuario(data.usuario);
            localStorage.setItem('auth_usuario', JSON.stringify(data.usuario));
          }
        })
        .catch((error) => {
          // Só remove token se for erro específico de token inválido
          // Erros de rede não devem remover o token
          if (error.message?.includes('campo telefone não encontrado') || 
              error.message?.includes('Token inválido') && error.message?.includes('campo telefone')) {
            setToken(null);
            setUsuario(null);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_usuario');
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (telefone: string, token?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Se o token já foi fornecido (do login com código), usa diretamente
      if (token) {
        setToken(token);
        // Garante que o token está salvo no localStorage
        localStorage.setItem('auth_token', token);
        const savedUsuario = localStorage.getItem('auth_usuario');
        if (savedUsuario) {
          try {
          setUsuario(JSON.parse(savedUsuario));
          } catch (e) {
            // Erro silencioso
          }
        }
        return { success: true };
      }
      
      // Caso contrário, faz login tradicional (deprecated)
      const data = await api.login(telefone);
      
      if (data.success) {
        setToken(data.token);
        setUsuario(data.usuario);
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_usuario', JSON.stringify(data.usuario));
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Erro ao fazer login' };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao conectar com o servidor' };
    }
  };

  const logout = () => {
    setToken(null);
    setUsuario(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_usuario');
  };

  const atualizarUsuario = useCallback((dados: Partial<Usuario>) => {
    setUsuario((usuarioAtual) => {
      if (!usuarioAtual) return usuarioAtual;
      const usuarioAtualizado = { ...usuarioAtual, ...dados };
      localStorage.setItem('auth_usuario', JSON.stringify(usuarioAtualizado));
      return usuarioAtualizado;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        login,
        logout,
        atualizarUsuario,
        isAuthenticated: !!token && !!usuario,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
