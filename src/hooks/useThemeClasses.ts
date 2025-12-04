import { useTheme } from '../contexts/ThemeContext';

/**
 * Hook para obter classes condicionais baseadas no tema
 */
export function useThemeClasses() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return {
    bg: isDark ? 'bg-slate-800' : 'bg-white',
    bgSecondary: isDark ? 'bg-slate-700' : 'bg-slate-50',
    text: isDark ? 'text-white' : 'text-slate-900',
    textSecondary: isDark ? 'text-slate-400' : 'text-slate-600',
    border: isDark ? 'border-slate-700' : 'border-slate-200',
    bgGradient: isDark ? 'from-slate-900 to-slate-800' : 'from-slate-50 to-slate-100',
    input: isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400',
    button: isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    card: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200',
  };
}

