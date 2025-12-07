import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useTheme } from './ThemeContext';

interface TemplateContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export function TemplateProvider({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <TemplateContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplate() {
  const context = useContext(TemplateContext);
  if (!context) {
    throw new Error('useTemplate deve ser usado dentro de TemplateProvider');
  }
  return context;
}
