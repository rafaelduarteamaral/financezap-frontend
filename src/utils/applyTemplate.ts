// Arquivo simplificado - apenas para compatibilidade
// O dark/light mode agora é gerenciado pelo ThemeContext e Tailwind

export interface Template {
  id: number;
  nome: string;
  tipo: 'dark' | 'light' | 'custom';
  corPrimaria: string;
  corSecundaria: string;
  corDestaque: string;
  corFundo: string;
  corTexto: string;
  ativo: boolean;
  criadoEm: string;
}

// Função vazia - não faz nada, apenas para compatibilidade
export function aplicarTemplate(_template: Template | any) {
  // Não faz nada - o Tailwind gerencia o dark mode via ThemeContext
}
