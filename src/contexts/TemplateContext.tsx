import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api';
import { aplicarTemplate as aplicarTemplateUtil, type Template } from '../utils/applyTemplate';
import { useAuth } from './AuthContext';

interface TemplateContextType {
  templates: Template[];
  templateAtivo: Template | null;
  carregando: boolean;
  carregarTemplates: () => Promise<void>;
  ativarTemplate: (id: number) => Promise<void>;
  atualizarTemplateAtivo: (template: Template) => void;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export function TemplateProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, usuario } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateAtivo, setTemplateAtivo] = useState<Template | null>(null);
  const [carregando, setCarregando] = useState(false);
  const observerRef = useRef<MutationObserver | null>(null);
  const templateAtivoRef = useRef<Template | null>(null);

  // Atualiza ref quando template ativo muda
  useEffect(() => {
    templateAtivoRef.current = templateAtivo;
  }, [templateAtivo]);

  // MutationObserver para detectar mudanças no DOM e reaplicar estilos
  useEffect(() => {
    if (!templateAtivo || templateAtivo.tipo === 'dark') {
      // Não precisa observar para dark mode
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      return;
    }

    // Cria observer para elementos dentro de main
    const observer = new MutationObserver((mutations) => {
      let shouldReapply = false;

      mutations.forEach((mutation) => {
        // Se novos nós foram adicionados
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              // Verifica se é um elemento relevante (tem classes slate, primary, etc)
              if (
                element.classList &&
                (element.classList.toString().includes('slate-') ||
                  element.classList.toString().includes('primary-') ||
                  element.classList.toString().includes('bg-') ||
                  element.classList.toString().includes('border-') ||
                  element.classList.toString().includes('text-'))
              ) {
                shouldReapply = true;
              }
              // Verifica filhos também
              if (element.querySelectorAll) {
                const relevantChildren = element.querySelectorAll(
                  '[class*="slate-"], [class*="primary-"], [class*="bg-"], [class*="border-"], [class*="text-"]'
                );
                if (relevantChildren.length > 0) {
                  shouldReapply = true;
                }
              }
            }
          });
        }
      });

      // Reaplica estilos se necessário
      if (shouldReapply && templateAtivoRef.current) {
        // Usa requestAnimationFrame para evitar múltiplas reaplicações
        requestAnimationFrame(() => {
          if (templateAtivoRef.current) {
            aplicarTemplateUtil(templateAtivoRef.current);
          }
        });
      }
    });

    // Observa mudanças no main
    const main = document.querySelector('main');
    if (main) {
      observer.observe(main, {
        childList: true,
        subtree: true,
        attributes: false, // Não observa mudanças de atributos para evitar loops
      });
      observerRef.current = observer;
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [templateAtivo]);

  const carregarTemplates = async () => {
    if (!isAuthenticated || !usuario) return;

    setCarregando(true);
    try {
      const response = await api.listarTemplates();
      if (response.success && response.templates) {
        setTemplates(response.templates);
        const ativo = response.templates.find((t: Template) => t.ativo);
        if (ativo) {
          setTemplateAtivo(ativo);
          aplicarTemplateUtil(ativo);
        } else {
          setTemplateAtivo(null);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    } finally {
      setCarregando(false);
    }
  };

  // Carrega templates quando usuário faz login
  useEffect(() => {
    if (isAuthenticated && usuario) {
      carregarTemplates();
    }
  }, [isAuthenticated, usuario]);

  const ativarTemplate = async (id: number) => {
    try {
      const response = await api.ativarTemplate(id);
      if (response.success) {
        await carregarTemplates();
        // Recarrega a página para aplicar o novo tema completamente
        window.location.reload();
      } else {
        throw new Error(response.error || 'Erro ao ativar template');
      }
    } catch (error: any) {
      console.error('Erro ao ativar template:', error);
      throw error;
    }
  };

  const atualizarTemplateAtivo = (template: Template) => {
    setTemplateAtivo(template);
    aplicarTemplateUtil(template);
  };

  // Listener para eventos de mudança de template
  useEffect(() => {
    const handleTemplateChange = (event: CustomEvent) => {
      const newTemplate = event.detail?.template;
      if (newTemplate && newTemplate.id !== templateAtivo?.id) {
        // Template foi alterado externamente, atualiza estado
        setTemplateAtivo(newTemplate);
      }
    };

    window.addEventListener('templateChanged', handleTemplateChange as EventListener);
    return () => {
      window.removeEventListener('templateChanged', handleTemplateChange as EventListener);
    };
  }, [templateAtivo]);

  return (
    <TemplateContext.Provider
      value={{
        templates,
        templateAtivo,
        carregando,
        carregarTemplates,
        ativarTemplate,
        atualizarTemplateAtivo,
      }}
    >
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplate() {
  const context = useContext(TemplateContext);
  if (context === undefined) {
    throw new Error('useTemplate deve ser usado dentro de um TemplateProvider');
  }
  return context;
}
