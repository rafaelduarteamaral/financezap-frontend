import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Verifica se há tema salvo no localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      return savedTheme;
    }
    // Verifica preferência do sistema
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    // Aplica o tema ao documento
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Salva no localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  // Escuta mudanças de tema vindas de templates
  useEffect(() => {
    const handleThemeChange = (event: CustomEvent) => {
      const newTheme = event.detail?.theme as Theme;
      if (newTheme && newTheme !== theme) {
        setTheme(newTheme);
      }
    };
    
    window.addEventListener('themeChanged', handleThemeChange as EventListener);
    
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange as EventListener);
    };
  }, [theme]);
  
  // Sincroniza com template ativo quando disponível
  useEffect(() => {
    const handleTemplateChange = (event: CustomEvent) => {
      const template = event.detail?.template;
      if (template) {
        // Se o template é dark ou light, sincroniza com o theme
        if (template.tipo === 'dark' && theme !== 'dark') {
          setTheme('dark');
        } else if (template.tipo === 'light' && theme !== 'light') {
          setTheme('light');
        }
        // Para custom, mantém o theme atual
      }
    };

    window.addEventListener('templateChanged', handleTemplateChange as EventListener);
    return () => {
      window.removeEventListener('templateChanged', handleTemplateChange as EventListener);
    };
  }, [theme]);
  
  // Aplica o tema imediatamente ao montar (antes do primeiro render)
  useEffect(() => {
    const root = document.documentElement;
    const savedTheme = localStorage.getItem('theme') as Theme;
    const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    if (initialTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
}

