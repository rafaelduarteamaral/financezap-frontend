// Sistema refatorado de aplicação de templates
// Versão simplificada e otimizada

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

// Cores slate padrão do Tailwind
const CORES_SLATE_PADRAO = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617'
};

// Cores dark detectáveis
const CORES_DARK = [
  'rgb(0, 0, 0)',
  'rgb(15, 23, 42)',
  'rgb(30, 41, 59)',
  'rgb(2, 0, 24)',
  'rgb(1, 2, 3)',
];

// Função auxiliar para gerar tons de uma cor
export function gerarTons(corBase: string) {
  const hex = corBase.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return {
    50: `rgb(${Math.min(255, r + 230)}, ${Math.min(255, g + 230)}, ${Math.min(255, b + 230)})`,
    100: `rgb(${Math.min(255, r + 204)}, ${Math.min(255, g + 204)}, ${Math.min(255, b + 204)})`,
    200: `rgb(${Math.min(255, r + 153)}, ${Math.min(255, g + 153)}, ${Math.min(255, b + 153)})`,
    300: `rgb(${Math.min(255, r + 102)}, ${Math.min(255, g + 102)}, ${Math.min(255, b + 102)})`,
    400: `rgb(${Math.min(255, r + 51)}, ${Math.min(255, g + 51)}, ${Math.min(255, b + 51)})`,
    500: corBase,
    600: `rgb(${Math.max(0, r - 41)}, ${Math.max(0, g - 41)}, ${Math.max(0, b - 41)})`,
    700: `rgb(${Math.max(0, r - 80)}, ${Math.max(0, g - 80)}, ${Math.max(0, b - 80)})`,
    800: `rgb(${Math.max(0, r - 107)}, ${Math.max(0, g - 107)}, ${Math.max(0, b - 107)})`,
    900: `rgb(${Math.max(0, r - 128)}, ${Math.max(0, g - 128)}, ${Math.max(0, b - 128)})`,
  };
}

// Verifica se uma cor é dark
function isDarkColor(color: string): boolean {
  if (!color) return false;
  return CORES_DARK.some(darkColor => 
    color === darkColor || color.includes(darkColor)
  );
}

// Mapeamento de classes para cores baseado no template
function obterCorParaClasse(
  classe: string,
  template: Template,
  tonsPrimaria: any,
  tonsFundo: any,
  tonsTexto: any
): string | null {
  const isLight = template.tipo === 'light';
  
  // Background colors - bg-slate-*
  if (classe.includes('bg-slate-') && !classe.includes('dark:')) {
    const match = classe.match(/bg-slate-(\d+)/);
    if (match) {
      const ton = match[1];
      if (isLight) {
        const mapeamento: { [key: string]: string } = {
          '800': '#ffffff',
          '700': '#f1f5f9',
          '600': '#e2e8f0',
          '500': '#cbd5e1',
          '400': '#94a3b8',
          '300': '#cbd5e1',
          '200': '#e2e8f0',
          '100': '#f1f5f9',
          '50': '#f8fafc'
        };
        return mapeamento[ton] || CORES_SLATE_PADRAO[ton as unknown as keyof typeof CORES_SLATE_PADRAO] || '#ffffff';
      }
      const tonKey = ton as unknown as keyof typeof tonsFundo;
      return tonsFundo[tonKey] || template.corFundo;
    }
  }
  
  // bg-white
  if (classe.includes('bg-white') && !classe.includes('dark:')) {
    return isLight ? '#ffffff' : (tonsFundo[50] || template.corFundo);
  }
  
  // dark:bg-slate-* (aplica mesmo sem classe dark)
  if (classe.includes('dark:bg-slate-')) {
    const match = classe.match(/dark:bg-slate-(\d+)/);
    if (match) {
      const ton = match[1];
      if (isLight) {
        const mapeamento: { [key: string]: string } = {
          '800': '#ffffff',
          '700': '#f1f5f9',
          '600': '#e2e8f0',
          '500': '#cbd5e1',
          '400': '#94a3b8',
          '300': '#cbd5e1',
          '200': '#e2e8f0',
          '100': '#f1f5f9',
          '50': '#f8fafc'
        };
        return mapeamento[ton] || '#ffffff';
      }
      const tonKey = ton as unknown as keyof typeof tonsFundo;
      return tonsFundo[tonKey] || template.corFundo;
    }
  }
  
  // dark:bg-white
  if (classe.includes('dark:bg-white')) {
    return isLight ? '#ffffff' : (tonsFundo[50] || template.corFundo);
  }
  
  // bg-black/opacity
  if (classe.includes('bg-black/')) {
    const match = classe.match(/bg-black\/(\d+)/);
    if (match) {
      const opacity = parseFloat(match[1]) / 100;
      const hex = template.corFundo.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }
  
  // bg-black
  if (classe.includes('bg-black') && !classe.includes('/')) {
    return template.corFundo;
  }
  
  // Border colors - border-slate-*
  if (classe.includes('border-slate-') && !classe.includes('dark:')) {
    const match = classe.match(/border-slate-(\d+)/);
    if (match) {
      const ton = match[1];
      if (isLight) {
        const mapeamento: { [key: string]: string } = {
          '800': '#e2e8f0',
          '700': '#cbd5e1',
          '600': '#94a3b8',
          '500': '#64748b',
          '400': '#94a3b8',
          '300': '#cbd5e1',
          '200': '#e2e8f0',
          '100': '#f1f5f9',
          '50': '#f8fafc'
        };
        return mapeamento[ton] || '#e2e8f0';
      }
      if (ton === '700' || ton === '800') {
        return tonsFundo[700] || tonsFundo[800] || template.corFundo;
      }
      if (ton === '200' || ton === '300') {
        return tonsFundo[200] || tonsFundo[300] || template.corFundo;
      }
      const tonKey = ton as unknown as keyof typeof tonsFundo;
      return tonsFundo[tonKey] || template.corFundo;
    }
  }
  
  // dark:border-slate-*
  if (classe.includes('dark:border-slate-')) {
    const match = classe.match(/dark:border-slate-(\d+)/);
    if (match) {
      const ton = match[1];
      if (isLight) {
        const mapeamento: { [key: string]: string } = {
          '800': '#e2e8f0',
          '700': '#cbd5e1',
          '600': '#94a3b8',
          '500': '#64748b',
          '400': '#94a3b8',
          '300': '#cbd5e1',
          '200': '#e2e8f0',
          '100': '#f1f5f9',
          '50': '#f8fafc'
        };
        return mapeamento[ton] || '#e2e8f0';
      }
      const tonKey = ton as unknown as keyof typeof tonsFundo;
      return tonsFundo[tonKey] || template.corFundo;
    }
  }
  
  // bg-primary-*
  if (classe.includes('bg-primary-')) {
    const match = classe.match(/bg-primary-(\d+)/);
    if (match) {
      const ton = match[1] as keyof typeof tonsPrimaria;
      return tonsPrimaria[ton] || template.corPrimaria;
    }
  }
  
  // text-primary-*
  if (classe.includes('text-primary-')) {
    const match = classe.match(/text-primary-(\d+)/);
    if (match) {
      const ton = match[1] as keyof typeof tonsPrimaria;
      return tonsPrimaria[ton] || template.corPrimaria;
    }
  }
  
  // border-primary-*
  if (classe.includes('border-primary-')) {
    const match = classe.match(/border-primary-(\d+)/);
    if (match) {
      const ton = match[1] as keyof typeof tonsPrimaria;
      return tonsPrimaria[ton] || template.corPrimaria;
    }
  }
  
  // text-slate-*
  if (classe.includes('text-slate-') && !classe.includes('dark:')) {
    const match = classe.match(/text-slate-(\d+)/);
    if (match) {
      const ton = match[1];
      if (isLight) {
        const mapeamento: { [key: string]: string } = {
          '50': '#0f172a',
          '100': '#1e293b',
          '200': '#334155',
          '300': '#475569',
          '400': '#64748b',
          '500': '#64748b',
          '600': '#475569',
          '700': '#334155',
          '800': '#1e293b',
          '900': '#0f172a'
        };
        return mapeamento[ton] || '#0f172a';
      }
      return parseInt(ton) < 500 
        ? (tonsTexto[50] || template.corTexto)
        : template.corTexto;
    }
  }
  
  // dark:text-slate-* ou dark:text-white
  if (classe.includes('dark:text-')) {
    if (classe.includes('dark:text-white')) {
      return isLight ? '#0f172a' : template.corTexto;
    }
    const match = classe.match(/dark:text-slate-(\d+)/);
    if (match) {
      const ton = match[1];
      if (isLight) {
        const mapeamento: { [key: string]: string } = {
          '50': '#0f172a',
          '100': '#1e293b',
          '200': '#334155',
          '300': '#475569',
          '400': '#64748b',
          '500': '#64748b',
          '600': '#475569',
          '700': '#334155',
          '800': '#1e293b',
          '900': '#0f172a'
        };
        return mapeamento[ton] || '#0f172a';
      }
      return parseInt(ton) < 500 
        ? (tonsTexto[50] || template.corTexto)
        : template.corTexto;
    }
    return isLight ? '#0f172a' : template.corTexto;
  }
  
  return null;
}

// Aplica estilos em um elemento baseado nas classes
function aplicarEstilosEmElemento(
  elemento: HTMLElement,
  template: Template,
  tonsPrimaria: any,
  tonsFundo: any,
  tonsTexto: any
) {
  if (!elemento.classList) return;
  
  const classes = Array.from(elemento.classList);
  const isLight = template.tipo === 'light';
  
  // Se for dark, remove estilos inline e deixa Tailwind gerenciar
  if (template.tipo === 'dark') {
    elemento.style.removeProperty('background-color');
    elemento.style.removeProperty('border-color');
    elemento.style.removeProperty('color');
    return;
  }
  
  // Para light e custom, aplica estilos baseados nas classes
  let bgColorAplicado = false;
  let borderColorAplicado = false;
  let textColorAplicado = false;
  
  classes.forEach((cls: string) => {
    const cor = obterCorParaClasse(cls, template, tonsPrimaria, tonsFundo, tonsTexto);
    
    if (cor) {
      if (cls.includes('bg-') && !bgColorAplicado) {
        elemento.style.setProperty('background-color', cor, 'important');
        bgColorAplicado = true;
      } else if (cls.includes('border-') && !borderColorAplicado) {
        elemento.style.setProperty('border-color', cor, 'important');
        borderColorAplicado = true;
      } else if (cls.includes('text-') && !textColorAplicado) {
        elemento.style.setProperty('color', cor, 'important');
        textColorAplicado = true;
      }
    }
  });
  
  // Verifica se ainda tem cores dark aplicadas e corrige
  if (isLight || template.tipo === 'custom') {
    const computed = window.getComputedStyle(elemento);
    const bgColor = computed.backgroundColor;
    const borderColor = computed.borderColor;
    
    if (isDarkColor(bgColor) && !bgColorAplicado) {
      // Tenta determinar a cor baseada nas classes
      const temBgSlate800 = classes.some(c => c.includes('bg-slate-800'));
      const temBgSlate700 = classes.some(c => c.includes('bg-slate-700'));
      const temBgWhite = classes.some(c => c.includes('bg-white'));
      
      if (temBgSlate800) {
        elemento.style.setProperty('background-color', isLight ? '#ffffff' : (tonsFundo[800] || template.corFundo), 'important');
      } else if (temBgSlate700) {
        elemento.style.setProperty('background-color', isLight ? '#f1f5f9' : (tonsFundo[700] || template.corFundo), 'important');
      } else if (temBgWhite) {
        elemento.style.setProperty('background-color', isLight ? '#ffffff' : (tonsFundo[50] || template.corFundo), 'important');
      } else {
        elemento.style.setProperty('background-color', isLight ? '#ffffff' : (tonsFundo[800] || template.corFundo), 'important');
      }
    }
    
    if (isDarkColor(borderColor) && !borderColorAplicado) {
      const temBorderSlate700 = classes.some(c => c.includes('border-slate-700'));
      const temBorderSlate200 = classes.some(c => c.includes('border-slate-200'));
      
      if (temBorderSlate700) {
        elemento.style.setProperty('border-color', isLight ? '#cbd5e1' : (tonsFundo[700] || template.corFundo), 'important');
      } else if (temBorderSlate200) {
        elemento.style.setProperty('border-color', isLight ? '#e2e8f0' : (tonsFundo[200] || template.corFundo), 'important');
      } else {
        elemento.style.setProperty('border-color', isLight ? '#cbd5e1' : (tonsFundo[700] || template.corFundo), 'important');
      }
    }
  }
}

// Aplica CSS variables no root
function aplicarCSSVariables(template: Template, tonsPrimaria: any, tonsFundo: any, _tonsTexto: any) {
  const root = document.documentElement;
  
  // Variáveis principais
  root.style.setProperty('--color-primary', template.corPrimaria);
  root.style.setProperty('--color-secondary', template.corSecundaria);
  root.style.setProperty('--color-accent', template.corDestaque);
  root.style.setProperty('--color-background', template.corFundo);
  root.style.setProperty('--color-text', template.corTexto);
  
  // Tons primários
  Object.entries(tonsPrimaria).forEach(([ton, cor]) => {
    root.style.setProperty(`--color-primary-${ton}`, cor as string);
  });
  
  // Tons de fundo (slate equivalentes)
  Object.entries(tonsFundo).forEach(([ton, cor]) => {
    root.style.setProperty(`--color-slate-${ton}`, cor as string);
  });
  
  // Variáveis de compatibilidade
  root.style.setProperty('--primary', template.corPrimaria);
  root.style.setProperty('--secondary', template.corSecundaria);
  root.style.setProperty('--accent', template.corDestaque);
}

// Aplica estilos em elementos específicos (header, InstallPrompt, etc)
function aplicarEstilosEmElementosEspecificos(template: Template, tonsFundo: any, _tonsTexto: any) {
  // Header
  const header = document.querySelector('header') as HTMLElement;
  if (header) {
    if (template.tipo === 'dark') {
      header.style.removeProperty('background-color');
      header.style.removeProperty('border-color');
    } else {
      const headerBg = template.tipo === 'light' ? '#ffffff' : (tonsFundo[50] || template.corFundo);
      const headerBorder = template.tipo === 'light' ? '#e2e8f0' : (tonsFundo[200] || template.corFundo);
      header.style.setProperty('background-color', headerBg, 'important');
      header.style.setProperty('border-color', headerBorder, 'important');
    }
  }
  
  // InstallPrompt
  const installPrompt = document.querySelector('.install-prompt-container') as HTMLElement;
  if (installPrompt) {
    if (template.tipo === 'dark') {
      installPrompt.style.removeProperty('background-color');
      const textosPrompt = installPrompt.querySelectorAll('h3, p, span, div[class*="text-"]');
      textosPrompt.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl) htmlEl.style.removeProperty('color');
      });
    } else {
      installPrompt.style.setProperty('background-color', template.tipo === 'light' ? '#ffffff' : (tonsFundo[50] || template.corFundo), 'important');
      const textosPrompt = installPrompt.querySelectorAll('h3, p, span, div[class*="text-"]');
      textosPrompt.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl && htmlEl.classList) {
          const classes = Array.from(htmlEl.classList);
          if (classes.some(c => c.includes('text-') || c.includes('dark:text-'))) {
            htmlEl.style.setProperty('color', template.corTexto, 'important');
          }
        }
      });
    }
  }
}

// Aplica estilos em todos os elementos dentro de main
function aplicarEstilosEmMain(template: Template, tonsPrimaria: any, tonsFundo: any, tonsTexto: any) {
  if (template.tipo === 'dark') return;
  
  const main = document.querySelector('main');
  if (!main) return;
  
  const elementos = main.querySelectorAll('*');
  elementos.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (!htmlEl) return;
    aplicarEstilosEmElemento(htmlEl, template, tonsPrimaria, tonsFundo, tonsTexto);
  });
}

// Função principal para aplicar template
export function aplicarTemplate(template: Template | any) {
  const root = document.documentElement;
  
  // 1. Gerar tons
  const tonsPrimaria = gerarTons(template.corPrimaria);
  const usarCoresSlatePadrao = template.tipo === 'dark' || template.tipo === 'light';
  const tonsFundo = usarCoresSlatePadrao ? CORES_SLATE_PADRAO : gerarTons(template.corFundo);
  const tonsTexto = usarCoresSlatePadrao ? CORES_SLATE_PADRAO : gerarTons(template.corTexto);
  
  // 2. Gerenciar classe dark
  if (template.tipo === 'dark') {
    root.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: 'dark' } }));
  } else {
    root.classList.remove('dark');
    if (template.tipo === 'light') {
      localStorage.setItem('theme', 'light');
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: 'light' } }));
    }
  }
  
  // 3. Aplicar CSS variables
  aplicarCSSVariables(template, tonsPrimaria, tonsFundo, tonsTexto);
  
  // 4. Aplicar estilos no body e app root
  if (template.tipo === 'custom') {
    document.body.style.setProperty('background-color', template.corFundo);
    document.body.style.setProperty('color', template.corTexto);
  } else {
    document.body.style.removeProperty('background-color');
    document.body.style.removeProperty('color');
  }
  
  const appRoot = document.querySelector('[class*="min-h-screen"]') as HTMLElement;
  if (appRoot) {
    if (template.tipo === 'light') {
      appRoot.style.setProperty('background', 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)', 'important');
    } else if (template.tipo === 'custom') {
      appRoot.style.setProperty('background', `linear-gradient(to bottom right, ${tonsFundo[50]}, ${tonsFundo[100]})`, 'important');
    } else {
      appRoot.style.removeProperty('background');
    }
  }
  
  // 5. Aplicar estilos em elementos primary
  const elementosPrimary = document.querySelectorAll('[class*="primary-"]');
  elementosPrimary.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (!htmlEl || !htmlEl.classList) return;
    
    const classes = Array.from(htmlEl.classList);
    classes.forEach((cls: string) => {
      const cor = obterCorParaClasse(cls, template, tonsPrimaria, tonsFundo, tonsTexto);
      if (cor) {
        if (cls.includes('bg-primary-')) {
          htmlEl.style.setProperty('background-color', cor, 'important');
        } else if (cls.includes('text-primary-')) {
          htmlEl.style.setProperty('color', cor, 'important');
        } else if (cls.includes('border-primary-')) {
          htmlEl.style.setProperty('border-color', cor, 'important');
        }
      }
    });
  });
  
  // 6. Aplicar estilos em elementos específicos (header, InstallPrompt, etc)
  aplicarEstilosEmElementosEspecificos(template, tonsFundo, tonsTexto);
  
  // 7. Aplicar estilos em elementos dentro de main
  aplicarEstilosEmMain(template, tonsPrimaria, tonsFundo, tonsTexto);
  
  // 8. Reaplicar após um pequeno delay para elementos renderizados dinamicamente
  requestAnimationFrame(() => {
    aplicarEstilosEmMain(template, tonsPrimaria, tonsFundo, tonsTexto);
    aplicarEstilosEmElementosEspecificos(template, tonsFundo, tonsTexto);
  });
  
  // 9. Disparar evento de mudança
  window.dispatchEvent(new CustomEvent('templateChanged', { detail: { template } }));
  
  console.log('🎨 Template aplicado:', template.nome, {
    tipo: template.tipo,
    primaria: template.corPrimaria,
    fundo: template.corFundo,
    texto: template.corTexto
  });
}
