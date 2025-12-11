// Utilitário para aplicar templates de cores dinamicamente

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

// Função auxiliar para gerar tons de uma cor
export function gerarTons(corBase: string) {
  // Converte hex para RGB
  const hex = corBase.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Gera tons mais claros e escuros
  const tons = {
    50: `rgb(${Math.min(255, r + 230)}, ${Math.min(255, g + 230)}, ${Math.min(255, b + 230)})`,
    100: `rgb(${Math.min(255, r + 204)}, ${Math.min(255, g + 204)}, ${Math.min(255, b + 204)})`,
    200: `rgb(${Math.min(255, r + 153)}, ${Math.min(255, g + 153)}, ${Math.min(255, b + 153)})`,
    300: `rgb(${Math.min(255, r + 102)}, ${Math.min(255, g + 102)}, ${Math.min(255, b + 102)})`,
    400: `rgb(${Math.min(255, r + 51)}, ${Math.min(255, g + 51)}, ${Math.min(255, b + 51)})`,
    500: corBase, // Cor base
    600: `rgb(${Math.max(0, r - 41)}, ${Math.max(0, g - 41)}, ${Math.max(0, b - 41)})`,
    700: `rgb(${Math.max(0, r - 80)}, ${Math.max(0, g - 80)}, ${Math.max(0, b - 80)})`,
    800: `rgb(${Math.max(0, r - 107)}, ${Math.max(0, g - 107)}, ${Math.max(0, b - 107)})`,
    900: `rgb(${Math.max(0, r - 128)}, ${Math.max(0, g - 128)}, ${Math.max(0, b - 128)})`,
  };
  
  return tons;
}

// Função principal para aplicar template
export function aplicarTemplate(template: Template | any) {
  const root = document.documentElement;
  
  // PRIMEIRO: Limpa TODOS os estilos inline dark de elementos dentro de main
  // Isso garante que estilos de templates anteriores sejam removidos ANTES de aplicar novos
  if (template.tipo === 'light' || template.tipo === 'custom') {
    const main = document.querySelector('main');
    if (main) {
      const todosElementos = main.querySelectorAll('*');
      todosElementos.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (!htmlEl) return;
        
        // Usa getComputedStyle para pegar o valor real, mesmo com !important
        const computedStyle = window.getComputedStyle(htmlEl);
        const bgColor = computedStyle.backgroundColor;
        const borderColor = computedStyle.borderColor;
        
        // Verifica se são cores dark e remove/substitui
        const isDarkBg = bgColor && (
          bgColor === 'rgb(0, 0, 0)' || 
          bgColor === 'rgb(15, 23, 42)' || 
          bgColor === 'rgb(30, 41, 59)' || 
          bgColor === 'rgb(2, 0, 24)' ||
          bgColor.includes('rgb(0, 0, 0)') || 
          bgColor.includes('rgb(15, 23, 42)') || 
          bgColor.includes('rgb(30, 41, 59)') || 
          bgColor.includes('rgb(2, 0, 24)')
        );
        
        const isDarkBorder = borderColor && (
          borderColor === 'rgb(2, 0, 24)' || 
          borderColor === 'rgb(30, 41, 59)' ||
          borderColor.includes('rgb(2, 0, 24)') || 
          borderColor.includes('rgb(30, 41, 59)')
        );
        
        // Remove os estilos dark primeiro
        if (isDarkBg) {
          htmlEl.style.removeProperty('background-color');
        }
        if (isDarkBorder) {
          htmlEl.style.removeProperty('border-color');
        }
      });
    }
  }
  
  // Aplica/remove classe dark no elemento raiz para templates padrão
  // Isso é essencial para o Tailwind aplicar os estilos dark mode
  if (template.tipo === 'dark') {
    root.classList.add('dark');
    // Atualiza localStorage para sincronizar com ThemeContext
    localStorage.setItem('theme', 'dark');
    // Dispara evento customizado para atualizar ThemeContext
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: 'dark' } }));
  } else if (template.tipo === 'light') {
    root.classList.remove('dark');
    // Atualiza localStorage para sincronizar com ThemeContext
    localStorage.setItem('theme', 'light');
    // Dispara evento customizado para atualizar ThemeContext
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: 'light' } }));
  } else if (template.tipo === 'custom') {
    // Para templates custom, REMOVE a classe dark para que os estilos inline funcionem
    root.classList.remove('dark');
    // Não atualiza o localStorage para não interferir com o ThemeContext
    // Os estilos customizados serão aplicados via inline styles
  }
  
  // Gera tons da cor primária
  const tonsPrimaria = gerarTons(template.corPrimaria);
  
  // Variáveis principais
  root.style.setProperty('--color-primary', template.corPrimaria);
  root.style.setProperty('--color-primary-light', template.corPrimaria);
  root.style.setProperty('--color-primary-dark', template.corPrimaria);
  root.style.setProperty('--color-secondary', template.corSecundaria);
  root.style.setProperty('--color-accent', template.corDestaque);
  root.style.setProperty('--color-background', template.corFundo);
  root.style.setProperty('--color-text', template.corTexto);
  
  // Variáveis para o Tailwind (primary-50 até primary-900)
  Object.entries(tonsPrimaria).forEach(([ton, cor]) => {
    root.style.setProperty(`--color-primary-${ton}`, cor);
  });
  
  // Variáveis para compatibilidade
  root.style.setProperty('--primary', template.corPrimaria);
  root.style.setProperty('--secondary', template.corSecundaria);
  root.style.setProperty('--accent', template.corDestaque);
  
  // Cores slate padrão do Tailwind (mantidas para templates dark/light)
  const coresSlatePadrao = {
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
  
  // Para templates dark e light padrão, mantém cores slate originais
  // Para templates custom, gera tons baseados na cor de fundo
  const usarCoresSlatePadrao = template.tipo === 'dark' || template.tipo === 'light';
  
  let tonsFundo: any;
  let tonsTexto: any;
  
  if (usarCoresSlatePadrao) {
    // Usa cores slate padrão do Tailwind
    tonsFundo = coresSlatePadrao;
    tonsTexto = coresSlatePadrao;
  } else {
    // Gera tons da cor de fundo para templates customizados
    tonsFundo = gerarTons(template.corFundo);
    tonsTexto = gerarTons(template.corTexto);
  }
  
  // Define variáveis CSS para cores de fundo (slate-* equivalentes)
  root.style.setProperty('--color-slate-50', tonsFundo[50]);
  root.style.setProperty('--color-slate-100', tonsFundo[100]);
  root.style.setProperty('--color-slate-200', tonsFundo[200]);
  root.style.setProperty('--color-slate-300', tonsFundo[300]);
  root.style.setProperty('--color-slate-400', tonsFundo[400]);
  root.style.setProperty('--color-slate-500', usarCoresSlatePadrao ? tonsFundo[500] : template.corFundo);
  root.style.setProperty('--color-slate-600', tonsFundo[600]);
  root.style.setProperty('--color-slate-700', tonsFundo[700]);
  root.style.setProperty('--color-slate-800', tonsFundo[800]);
  root.style.setProperty('--color-slate-900', tonsFundo[900]);
  
  // Define variáveis para cores de texto
  root.style.setProperty('--color-text-light', tonsTexto[50]);
  root.style.setProperty('--color-text-medium', tonsTexto[300]);
  root.style.setProperty('--color-text-dark', template.corTexto);
  
  // Aplica também no body para garantir que funcione em todos os elementos
  // Para templates dark/light, usa cores slate padrão
  if (usarCoresSlatePadrao) {
    // Para dark/light, mantém cores padrão do Tailwind
    document.body.style.removeProperty('background-color');
    document.body.style.removeProperty('color');
  } else {
    // Para custom, aplica cores do template
    document.body.style.setProperty('background-color', template.corFundo);
    document.body.style.setProperty('color', template.corTexto);
  }
  
  // Aplica no elemento raiz (div principal)
  const appRoot = document.querySelector('[class*="min-h-screen"]') as HTMLElement;
  if (appRoot) {
    if (template.tipo === 'dark') {
      // Para dark, remove estilos inline e deixa o Tailwind gerenciar
      appRoot.style.removeProperty('background');
    } else if (template.tipo === 'light') {
      // Para light, aplica gradiente claro
      appRoot.style.setProperty('background', 'linear-gradient(to bottom right, #f8fafc, #f1f5f9)', 'important');
    } else {
      // Para custom, aplica gradiente do template
      appRoot.style.setProperty('background', `linear-gradient(to bottom right, ${tonsFundo[50]}, ${tonsFundo[100]})`, 'important');
    }
  }
  
  // Força re-renderização aplicando classe no body
  document.body.classList.add('template-applied');
  setTimeout(() => document.body.classList.remove('template-applied'), 0);
  
  // Força atualização de todos os elementos que usam variáveis CSS
  const event = new Event('templateChanged');
  window.dispatchEvent(event);
  
  // Força reflow para garantir que as mudanças sejam aplicadas
  void document.body.offsetHeight;
  
  // Aplica estilos inline em elementos com classes primary específicas
  // Isso garante que as cores sejam aplicadas mesmo se o Tailwind não reconhecer as variáveis
  try {
    const elementosPrimary = document.querySelectorAll('[class*="primary-"]');
    elementosPrimary.forEach((el) => {
      const htmlEl = el as HTMLElement;
      
      // Verifica se o elemento existe
      if (!htmlEl || !htmlEl.classList) return;
      
      // Usa classList ao invés de className para evitar problemas com SVG
      const classes = Array.from(htmlEl.classList);
      
      // Verifica se é um botão ativo (tem bg-primary-*)
      const temBgPrimary = classes.some(c => c.includes('bg-primary-'));
      
      classes.forEach((cls: string) => {
        // Aplica cores baseado nas classes encontradas
        if (cls.includes('bg-primary-')) {
          // Extrai o número do tom (500, 600, 700, etc)
          const match = cls.match(/bg-primary-(\d+)/);
          if (match) {
            const ton = match[1] as unknown as keyof typeof tonsPrimaria;
            const cor = tonsPrimaria[ton] || template.corPrimaria;
            htmlEl.style.backgroundColor = cor;
          } else {
            htmlEl.style.backgroundColor = template.corPrimaria;
          }
        }
        
        if (cls.includes('text-primary-')) {
          const match = cls.match(/text-primary-(\d+)/);
          if (match) {
            const ton = match[1] as unknown as keyof typeof tonsPrimaria;
            const cor = tonsPrimaria[ton] || template.corPrimaria;
            htmlEl.style.color = cor;
          } else {
            htmlEl.style.color = template.corPrimaria;
          }
        } else if (cls.includes('text-white') && temBgPrimary) {
          // Se tem bg-primary e text-white, mantém texto branco para contraste
          htmlEl.style.color = '#ffffff';
        }
        
        if (cls.includes('border-primary-')) {
          const match = cls.match(/border-primary-(\d+)/);
          if (match) {
            const ton = match[1] as unknown as keyof typeof tonsPrimaria;
            const cor = tonsPrimaria[ton] || template.corPrimaria;
            htmlEl.style.borderColor = cor;
          } else {
            htmlEl.style.borderColor = template.corPrimaria;
          }
        }
      });
    });
    
    // Limpa estilos inline de botões que mudaram de estado (de ativo para inativo ou vice-versa)
    // Isso garante que o React possa gerenciar o estado corretamente
    const botoesAbas = document.querySelectorAll('button[class*="bg-"]');
    botoesAbas.forEach((btn) => {
      const btnEl = btn as HTMLElement;
      if (!btnEl || !btnEl.classList) return;
      
      const classes = Array.from(btnEl.classList);
      const temPrimary = classes.some(c => c.includes('bg-primary-'));
      
      // Se o botão tem bg-primary-*, remove estilos inline de background que possam interferir
      // O React vai aplicar a cor correta através das classes
      if (temPrimary) {
        // Mantém apenas a cor de fundo do primary, mas remove outras interferências
        // Não faz nada aqui, pois já aplicamos a cor primary acima
      } else {
        // Para botões inativos, aplicamos as cores do template
        // Isso já é feito na seção de elementos slate acima
      }
    });
  } catch (error) {
    // Erro silencioso
  }
  
  // Aplica estilos inline em elementos com classes slate-* (fundo e menus)
  // Apenas para templates customizados - templates dark/light mantêm cores padrão
  try {
    // PRIMEIRO: Substitui TODOS os estilos inline dark de elementos dentro de main
    // Isso garante que estilos de templates anteriores sejam substituídos pelas cores do template atual
    if (template.tipo === 'light' || template.tipo === 'custom') {
      const main = document.querySelector('main');
      if (main) {
        const todosElementos = main.querySelectorAll('*');
        todosElementos.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (!htmlEl) return;
          
          // PRIMEIRO: Remove todos os estilos inline dark
          const computedStyle = window.getComputedStyle(htmlEl);
          const bgColor = computedStyle.backgroundColor;
          const borderColor = computedStyle.borderColor;
          
          // Verifica se são cores dark
          const isDarkBg = bgColor && (
            bgColor === 'rgb(0, 0, 0)' || 
            bgColor === 'rgb(15, 23, 42)' || 
            bgColor === 'rgb(30, 41, 59)' || 
            bgColor === 'rgb(2, 0, 24)' ||
            bgColor.includes('rgb(0, 0, 0)') || 
            bgColor.includes('rgb(15, 23, 42)') || 
            bgColor.includes('rgb(30, 41, 59)') || 
            bgColor.includes('rgb(2, 0, 24)')
          );
          
          const isDarkBorder = borderColor && (
            borderColor === 'rgb(2, 0, 24)' || 
            borderColor === 'rgb(30, 41, 59)' ||
            borderColor.includes('rgb(2, 0, 24)') || 
            borderColor.includes('rgb(30, 41, 59)')
          );
          
          // Remove os estilos dark primeiro
          if (isDarkBg) {
            htmlEl.style.removeProperty('background-color');
            // Força remoção usando setProperty com valor vazio
            htmlEl.style.setProperty('background-color', '', 'important');
          }
          if (isDarkBorder) {
            htmlEl.style.removeProperty('border-color');
            // Força remoção usando setProperty com valor vazio
            htmlEl.style.setProperty('border-color', '', 'important');
          }
        });
      }
    }
    
    // Se for template dark, remove estilos inline e não aplica novos (deixa Tailwind gerenciar)
    if (template.tipo === 'dark') {
      // Remove estilos inline que possam ter sido aplicados anteriormente
      const elementosSlate = document.querySelectorAll('[class*="slate-"], [class*="dark:"], [class*="bg-black"], [class*="bg-white"]');
      elementosSlate.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl) {
          htmlEl.style.removeProperty('background-color');
          htmlEl.style.removeProperty('color');
          htmlEl.style.removeProperty('border-color');
          htmlEl.style.removeProperty('background');
        }
      });
    } else {
      // Para light e custom, aplica estilos inline para sobrescrever classes dark:*
      // Isso garante que mesmo com a classe dark removida, elementos com classes dark:* sejam atualizados
      // Seleciona TODOS os elementos que podem ter classes slate-*, dark:*, bg-black, etc.
      // Isso inclui elementos com classes condicionais baseadas em isDark
      // IMPORTANTE: Seleciona também elementos dentro de main, section, div, etc.
      const elementosSlate = document.querySelectorAll('main [class*="slate-"], main [class*="dark:"], main [class*="bg-black"], main [class*="bg-white"], [class*="slate-"], [class*="dark:"], [class*="bg-black"], [class*="bg-white"]');
      elementosSlate.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (!htmlEl) return;
        
        // PRIMEIRO: Substitui estilos inline dark que possam estar aplicados
        // Usa getComputedStyle para pegar o valor real, mesmo com !important
        const computedStyle = window.getComputedStyle(htmlEl);
        const bgColorComputed = computedStyle.backgroundColor;
        const borderColorComputed = computedStyle.borderColor;
        
        const isDarkBg = bgColorComputed && (
          bgColorComputed === 'rgb(0, 0, 0)' || 
          bgColorComputed === 'rgb(15, 23, 42)' || 
          bgColorComputed === 'rgb(30, 41, 59)' || 
          bgColorComputed === 'rgb(2, 0, 24)' ||
          bgColorComputed.includes('rgb(0, 0, 0)') || 
          bgColorComputed.includes('rgb(15, 23, 42)') || 
          bgColorComputed.includes('rgb(30, 41, 59)') || 
          bgColorComputed.includes('rgb(2, 0, 24)')
        );
        
        const isDarkBorder = borderColorComputed && (
          borderColorComputed === 'rgb(2, 0, 24)' || 
          borderColorComputed === 'rgb(30, 41, 59)' ||
          borderColorComputed.includes('rgb(2, 0, 24)') || 
          borderColorComputed.includes('rgb(30, 41, 59)')
        );
        
        if (isDarkBg) {
          const cor = template.tipo === 'light' ? '#ffffff' : (tonsFundo[800] || template.corFundo);
          htmlEl.style.setProperty('background-color', cor, 'important');
        }
        if (isDarkBorder) {
          const cor = template.tipo === 'light' ? '#cbd5e1' : (tonsFundo[700] || template.corFundo);
          htmlEl.style.setProperty('border-color', cor, 'important');
        }
        
        if (!htmlEl.classList) return;
        
        const classes = Array.from(htmlEl.classList);
        
        classes.forEach((cls: string) => {
          // Background colors - bg-slate-* (aplica sempre, mesmo se já tiver estilo inline)
          if (cls.includes('bg-slate-') && !cls.includes('dark:')) {
            const match = cls.match(/bg-slate-(\d+)/);
            if (match) {
              const ton = match[1];
              let cor: string;
              if (template.tipo === 'light') {
                // Para light, mapeia tons escuros para tons claros
                const mapeamentoLight: { [key: string]: string } = {
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
                cor = mapeamentoLight[ton] || '#ffffff';
              } else {
                // Para custom, usa tons do template
                const tonKey = ton as keyof typeof tonsFundo;
                cor = tonsFundo[tonKey] || template.corFundo;
              }
              // SEMPRE aplica, sobrescrevendo qualquer estilo dark anterior
              htmlEl.style.setProperty('background-color', cor, 'important');
            } else if (cls.includes('bg-white')) {
              const cor = template.tipo === 'light' ? '#ffffff' : (tonsFundo[50] || template.corFundo);
              htmlEl.style.setProperty('background-color', cor, 'important');
            }
          }
          
          // Border colors - border-slate-* (aplica sempre)
          if (cls.includes('border-slate-') && !cls.includes('dark:')) {
            const match = cls.match(/border-slate-(\d+)/);
            if (match) {
              const ton = match[1];
              let cor: string;
              if (template.tipo === 'light') {
                // Para light, mapeia tons escuros para tons claros
                const mapeamentoLight: { [key: string]: string } = {
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
                cor = mapeamentoLight[ton] || '#e2e8f0';
              } else {
                // Para custom, usa tons do template
                const tonKey = ton as keyof typeof tonsFundo;
                if (ton === '700' || ton === '800') {
                  cor = tonsFundo[700] || tonsFundo[800] || template.corFundo;
                } else if (ton === '200' || ton === '300') {
                  cor = tonsFundo[200] || tonsFundo[300] || template.corFundo;
                } else {
                  cor = tonsFundo[tonKey] || template.corFundo;
                }
              }
              // SEMPRE aplica, sobrescrevendo qualquer estilo dark anterior
              htmlEl.style.setProperty('border-color', cor, 'important');
            }
          }
          
          // Background colors - dark:bg-slate-* (aplica mesmo sem classe dark)
          // Para light, usa cores claras; para custom, usa tons do template
          if (cls.includes('dark:bg-slate-')) {
            const match = cls.match(/dark:bg-slate-(\d+)/);
            if (match) {
              const ton = match[1];
              let cor: string;
              if (template.tipo === 'light') {
                // Para light, mapeia tons escuros para tons claros
                const mapeamentoLight: { [key: string]: string } = {
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
                cor = mapeamentoLight[ton] || '#ffffff';
              } else {
                // Para custom, usa tons do template
                const tonKey = ton as keyof typeof tonsFundo;
                cor = tonsFundo[tonKey] || template.corFundo;
              }
              htmlEl.style.setProperty('background-color', cor, 'important');
            }
          }
          
          // Background colors - dark:bg-white
          if (cls.includes('dark:bg-white')) {
            const cor = template.tipo === 'light' ? '#ffffff' : (tonsFundo[50] || template.corFundo);
            htmlEl.style.setProperty('background-color', cor, 'important');
          }
          
          // Background colors - bg-black/50, bg-black/30, etc. (overlays de modais)
          // Aplica cor de fundo do template com opacidade
          if (cls.includes('bg-black/')) {
            const match = cls.match(/bg-black\/(\d+)/);
            if (match) {
              const opacity = parseFloat(match[1]) / 100; // Converte 50 para 0.5
              // Converte cor hex para rgba
              const hex = template.corFundo.replace('#', '');
              const r = parseInt(hex.substring(0, 2), 16);
              const g = parseInt(hex.substring(2, 4), 16);
              const b = parseInt(hex.substring(4, 6), 16);
              const corComOpacidade = `rgba(${r}, ${g}, ${b}, ${opacity})`;
              htmlEl.style.setProperty('background-color', corComOpacidade, 'important');
            } else if (cls === 'bg-black') {
              // bg-black sem opacidade - usa cor de fundo do template
              htmlEl.style.setProperty('background-color', template.corFundo, 'important');
            }
          }
          
          // Background colors - dark:bg-black (aplica mesmo sem classe dark)
          if (cls.includes('dark:bg-black')) {
            htmlEl.style.setProperty('background-color', template.corFundo, 'important');
          }
          
          // Text colors
          if (cls.includes('text-slate-') && !cls.includes('dark:')) {
            const match = cls.match(/text-slate-(\d+)/);
            if (match) {
              const ton = match[1];
              let cor: string;
              if (template.tipo === 'light') {
                // Para light, mapeia tons claros para tons escuros
                const mapeamentoLight: { [key: string]: string } = {
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
                cor = mapeamentoLight[ton] || '#0f172a';
              } else {
                // Para custom, usa cor de texto do template
                cor = parseInt(ton) < 500 
                  ? tonsTexto[50] || template.corTexto 
                  : template.corTexto;
              }
              htmlEl.style.setProperty('color', cor, 'important');
            }
          }
          
          // Também aplica para classes dark:text-slate-* quando template é light ou custom
          if (cls.includes('dark:text-slate-') || cls.includes('dark:text-white') || cls.includes('dark:text-')) {
            const match = cls.match(/dark:text-slate-(\d+)/);
            let cor: string;
            if (match) {
              const ton = match[1];
              if (template.tipo === 'light') {
                // Para light, mapeia tons claros para tons escuros
                const mapeamentoLight: { [key: string]: string } = {
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
                cor = mapeamentoLight[ton] || '#0f172a';
              } else {
                // Para custom, usa cor de texto do template
                cor = parseInt(ton) < 500 
                  ? tonsTexto[50] || template.corTexto 
                  : template.corTexto;
              }
              htmlEl.style.setProperty('color', cor, 'important');
            } else if (cls.includes('dark:text-white')) {
              cor = template.tipo === 'light' ? '#0f172a' : template.corTexto;
              htmlEl.style.setProperty('color', cor, 'important');
            } else if (cls.includes('dark:text-')) {
              // Para outras classes dark:text-*, aplica cor baseada no tipo
              cor = template.tipo === 'light' ? '#0f172a' : template.corTexto;
              htmlEl.style.setProperty('color', cor, 'important');
            }
          }
          
          // Background colors - outras classes dark:bg-* (dark:bg-red-900/20, etc.)
          if (cls.includes('dark:bg-') && !cls.includes('dark:bg-slate-') && !cls.includes('dark:bg-white') && !cls.includes('dark:bg-black')) {
            // Para outras classes dark:bg-*, aplica cor de fundo do template com opacidade se houver
            const opacityMatch = cls.match(/dark:bg-\w+\/(\d+)/);
            if (opacityMatch) {
              const opacity = parseFloat(opacityMatch[1]) / 100;
              // Converte cor hex para rgba
              const hex = template.corFundo.replace('#', '');
              const r = parseInt(hex.substring(0, 2), 16);
              const g = parseInt(hex.substring(2, 4), 16);
              const b = parseInt(hex.substring(4, 6), 16);
              const corComOpacidade = `rgba(${r}, ${g}, ${b}, ${opacity})`;
              htmlEl.style.setProperty('background-color', corComOpacidade, 'important');
            } else {
              htmlEl.style.setProperty('background-color', template.corFundo, 'important');
            }
          }
          
          // Border colors
          if (cls.includes('border-slate-') && !cls.includes('dark:')) {
            const match = cls.match(/border-slate-(\d+)/);
            if (match) {
              const ton = match[1];
              let cor: string;
              if (template.tipo === 'light') {
                // Para light, mapeia tons escuros para tons claros
                const mapeamentoLight: { [key: string]: string } = {
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
                cor = mapeamentoLight[ton] || '#e2e8f0';
              } else {
                // Para custom, usa tons do template
                const tonKey = ton as keyof typeof tonsFundo;
                if (ton === '700' || ton === '800') {
                  cor = tonsFundo[700] || tonsFundo[800] || template.corFundo;
                } else if (ton === '200' || ton === '300') {
                  cor = tonsFundo[200] || tonsFundo[300] || template.corFundo;
                } else {
                  cor = tonsFundo[tonKey] || template.corFundo;
                }
              }
              htmlEl.style.setProperty('border-color', cor, 'important');
            }
          }
          
          // Border colors - dark:border-slate-*
          if (cls.includes('dark:border-slate-')) {
            const match = cls.match(/dark:border-slate-(\d+)/);
            if (match) {
              const ton = match[1];
              let cor: string;
              if (template.tipo === 'light') {
                // Para light, mapeia tons escuros para tons claros
                const mapeamentoLight: { [key: string]: string } = {
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
                cor = mapeamentoLight[ton] || '#e2e8f0';
              } else {
                // Para custom, usa tons do template
                const tonKey = ton as keyof typeof tonsFundo;
                cor = tonsFundo[tonKey] || template.corFundo;
              }
              htmlEl.style.setProperty('border-color', cor, 'important');
            }
          }
        });
        
        // DEPOIS de processar todas as classes, verifica novamente se ainda tem cores dark
        // e força substituição (pode ter sido aplicado por outra parte do código)
        const computedStyleFinal = window.getComputedStyle(htmlEl);
        const bgColorFinal = computedStyleFinal.backgroundColor;
        const borderColorFinal = computedStyleFinal.borderColor;
        
        const aindaTemDarkBg = bgColorFinal && (
          bgColorFinal === 'rgb(0, 0, 0)' || 
          bgColorFinal === 'rgb(15, 23, 42)' || 
          bgColorFinal === 'rgb(30, 41, 59)' || 
          bgColorFinal === 'rgb(2, 0, 24)' ||
          bgColorFinal.includes('rgb(0, 0, 0)') || 
          bgColorFinal.includes('rgb(15, 23, 42)') || 
          bgColorFinal.includes('rgb(30, 41, 59)') || 
          bgColorFinal.includes('rgb(2, 0, 24)')
        );
        
        const aindaTemDarkBorder = borderColorFinal && (
          borderColorFinal === 'rgb(2, 0, 24)' || 
          borderColorFinal === 'rgb(30, 41, 59)' ||
          borderColorFinal.includes('rgb(2, 0, 24)') || 
          borderColorFinal.includes('rgb(30, 41, 59)')
        );
        
        // Se ainda tem cores dark, força substituição baseada nas classes presentes
        if (aindaTemDarkBg && htmlEl.classList) {
          const classesArray = Array.from(htmlEl.classList);
          const temBgSlate800 = classesArray.some(c => c.includes('bg-slate-800'));
          const temBgSlate700 = classesArray.some(c => c.includes('bg-slate-700'));
          const temBgWhite = classesArray.some(c => c.includes('bg-white'));
          
          if (temBgSlate800) {
            const cor = template.tipo === 'light' ? '#ffffff' : (tonsFundo[800] || template.corFundo);
            htmlEl.style.setProperty('background-color', cor, 'important');
          } else if (temBgSlate700) {
            const cor = template.tipo === 'light' ? '#f1f5f9' : (tonsFundo[700] || template.corFundo);
            htmlEl.style.setProperty('background-color', cor, 'important');
          } else if (temBgWhite) {
            const cor = template.tipo === 'light' ? '#ffffff' : (tonsFundo[50] || template.corFundo);
            htmlEl.style.setProperty('background-color', cor, 'important');
          } else {
            // Se não tem classe específica, usa cor padrão do template
            const cor = template.tipo === 'light' ? '#ffffff' : (tonsFundo[800] || template.corFundo);
            htmlEl.style.setProperty('background-color', cor, 'important');
          }
        }
        
        if (aindaTemDarkBorder && htmlEl.classList) {
          const classesArray = Array.from(htmlEl.classList);
          const temBorderSlate700 = classesArray.some(c => c.includes('border-slate-700'));
          const temBorderSlate200 = classesArray.some(c => c.includes('border-slate-200'));
          
          if (temBorderSlate700) {
            const cor = template.tipo === 'light' ? '#cbd5e1' : (tonsFundo[700] || template.corFundo);
            htmlEl.style.setProperty('border-color', cor, 'important');
          } else if (temBorderSlate200) {
            const cor = template.tipo === 'light' ? '#e2e8f0' : (tonsFundo[200] || template.corFundo);
            htmlEl.style.setProperty('border-color', cor, 'important');
          } else {
            // Se não tem classe específica, usa cor padrão do template
            const cor = template.tipo === 'light' ? '#cbd5e1' : (tonsFundo[700] || template.corFundo);
            htmlEl.style.setProperty('border-color', cor, 'important');
          }
        }
      });
    }
    
    // Atualiza elementos específicos - Header e todos os seus elementos
    const header = document.querySelector('header') as HTMLElement;
    if (header) {
      if (template.tipo === 'dark') {
        // Para dark, remove estilos inline e deixa o Tailwind gerenciar
        header.style.removeProperty('background-color');
        header.style.removeProperty('border-color');
      } else {
        // Para light e custom, aplica cores do template
        const headerBg = template.tipo === 'light' ? '#ffffff' : (tonsFundo[50] || template.corFundo);
        header.style.setProperty('background-color', headerBg, 'important');
        const headerBorder = template.tipo === 'light' ? '#e2e8f0' : (tonsFundo[200] || template.corFundo);
        header.style.setProperty('border-color', headerBorder, 'important');
      }
      
      // Atualiza todos os elementos dentro do header (incluindo filhos aninhados)
      // Para templates light e custom, aplica estilos inline para garantir que não usem cores dark
      if (template.tipo === 'light' || template.tipo === 'custom') {
        const headerChildren = header.querySelectorAll('*');
        headerChildren.forEach((child) => {
          const childEl = child as HTMLElement;
          if (!childEl || !childEl.classList) return;
          
          const classes = Array.from(childEl.classList);
          
          // Verifica se é um botão ativo ANTES de aplicar estilos
          const temPrimary = classes.some(c => c.includes('bg-primary-'));
          if (temPrimary) {
            // Botões ativos não recebem estilos inline de slate
            // A cor primary será aplicada pela seção de elementos primary abaixo
            return;
          }
          
          classes.forEach((cls: string) => {
            // Backgrounds - mapeia classes slate para tons do template
            // Aplica apenas em elementos inativos (sem bg-primary-*)
            if (cls.includes('bg-slate-800') || cls.includes('dark:bg-slate-800')) {
              const cor = template.tipo === 'light' ? '#ffffff' : (tonsFundo[800] || template.corFundo);
              childEl.style.setProperty('background-color', cor, 'important');
            } else if (cls.includes('bg-slate-700') || cls.includes('dark:bg-slate-700')) {
              const cor = template.tipo === 'light' ? '#f1f5f9' : (tonsFundo[700] || template.corFundo);
              childEl.style.setProperty('background-color', cor, 'important');
            } else if (cls.includes('bg-slate-600') || cls.includes('dark:bg-slate-600')) {
              const cor = template.tipo === 'light' ? '#e2e8f0' : (tonsFundo[600] || template.corFundo);
              childEl.style.setProperty('background-color', cor, 'important');
            } else if (cls.includes('bg-slate-100') || cls.includes('dark:bg-slate-100')) {
              const cor = template.tipo === 'light' ? '#f1f5f9' : (tonsFundo[100] || template.corFundo);
              childEl.style.setProperty('background-color', cor, 'important');
            } else if (cls.includes('bg-slate-50') || cls.includes('dark:bg-slate-50')) {
              const cor = template.tipo === 'light' ? '#f8fafc' : (tonsFundo[50] || template.corFundo);
              childEl.style.setProperty('background-color', cor, 'important');
            } else if (cls.includes('bg-white') || cls.includes('dark:bg-white')) {
              const cor = template.tipo === 'light' ? '#ffffff' : (tonsFundo[50] || template.corFundo);
              childEl.style.setProperty('background-color', cor, 'important');
            } else if (cls.includes('bg-slate-200') || cls.includes('dark:bg-slate-200')) {
              const cor = template.tipo === 'light' ? '#e2e8f0' : (tonsFundo[200] || template.corFundo);
              childEl.style.setProperty('background-color', cor, 'important');
            }
            
            // Text colors - também trata classes dark:text-*
            if (cls.includes('text-white') || cls.includes('dark:text-white')) {
              const cor = template.tipo === 'light' ? '#0f172a' : template.corTexto;
              childEl.style.setProperty('color', cor, 'important');
            } else if (cls.includes('text-slate-900') || cls.includes('dark:text-slate-900')) {
              const cor = template.tipo === 'light' ? '#0f172a' : template.corTexto;
              childEl.style.setProperty('color', cor, 'important');
            } else if (cls.includes('text-slate-700') || cls.includes('dark:text-slate-700')) {
              const cor = template.tipo === 'light' ? '#334155' : template.corTexto;
              childEl.style.setProperty('color', cor, 'important');
            } else if (cls.includes('text-slate-600') || cls.includes('dark:text-slate-600')) {
              const cor = template.tipo === 'light' ? '#475569' : template.corTexto;
              childEl.style.setProperty('color', cor, 'important');
            } else if (cls.includes('text-slate-400') || cls.includes('dark:text-slate-400')) {
              const cor = template.tipo === 'light' ? '#94a3b8' : template.corTexto;
              childEl.style.setProperty('color', cor, 'important');
            } else if (cls.includes('text-slate-500') || cls.includes('dark:text-slate-500')) {
              const cor = template.tipo === 'light' ? '#64748b' : template.corTexto;
              childEl.style.setProperty('color', cor, 'important');
            } else if (cls.includes('text-slate-300') || cls.includes('dark:text-slate-300')) {
              const cor = template.tipo === 'light' ? '#cbd5e1' : template.corTexto;
              childEl.style.setProperty('color', cor, 'important');
            }
            
            // Borders - também trata classes dark:border-*
            if (cls.includes('border-slate-700') || cls.includes('dark:border-slate-700')) {
              const cor = template.tipo === 'light' ? '#334155' : (tonsFundo[700] || template.corFundo);
              childEl.style.setProperty('border-color', cor, 'important');
            } else if (cls.includes('border-slate-200') || cls.includes('dark:border-slate-200')) {
              const cor = template.tipo === 'light' ? '#e2e8f0' : (tonsFundo[200] || template.corFundo);
              childEl.style.setProperty('border-color', cor, 'important');
            }
          });
        });
        
        // Força atualização de textos específicos no header
        const textosHeader = header.querySelectorAll('h1, h2, h3, p, span, div, button');
        textosHeader.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (!htmlEl || !htmlEl.classList) return;
          
          const classes = Array.from(htmlEl.classList);
          const temTexto = classes.some(c => 
            c.includes('text-') && (c.includes('slate-') || c.includes('white'))
          );
          
          if (temTexto) {
            // Se tem classe de texto, atualiza baseado no tipo do template
            if (classes.some(c => c.includes('text-white'))) {
              htmlEl.style.color = template.corTexto;
            } else if (classes.some(c => c.includes('text-slate-900'))) {
              htmlEl.style.color = template.corTexto;
            } else if (classes.some(c => c.includes('text-slate-700'))) {
              htmlEl.style.color = template.corTexto;
            } else if (classes.some(c => c.includes('text-slate-400') || c.includes('text-slate-600'))) {
              htmlEl.style.color = template.tipo === 'dark' ? tonsTexto[300] : template.corTexto;
            } else if (classes.some(c => c.includes('text-slate-300'))) {
              htmlEl.style.color = template.corTexto;
            }
          }
        });
                } else {
                  // Para template dark, remove estilos inline e deixa o Tailwind gerenciar
                  if (template.tipo === 'dark') {
                    const headerChildren = header.querySelectorAll('*');
                    headerChildren.forEach((child) => {
                      const childEl = child as HTMLElement;
                      if (childEl) {
                        childEl.style.removeProperty('background-color');
                        childEl.style.removeProperty('color');
                        childEl.style.removeProperty('border-color');
                      }
                    });
                  }
                  // Para light e custom, os estilos já foram aplicados acima
                }
    }
    
    // Atualiza fundo do elemento principal (já tratado acima no appRoot)
    
    // Atualiza InstallPrompt
    const installPrompt = document.querySelector('.install-prompt-container') as HTMLElement;
    if (installPrompt) {
      if (template.tipo === 'dark') {
        // Para dark, remove estilos inline e deixa o Tailwind gerenciar
        installPrompt.style.removeProperty('background-color');
        const textosPrompt = installPrompt.querySelectorAll('h3, p, span, div[class*="text-"]');
        textosPrompt.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl) {
            htmlEl.style.removeProperty('color');
          }
        });
      } else {
        // Para light e custom, aplica cores do template via estilos inline
        installPrompt.style.setProperty('background-color', template.tipo === 'light' ? '#ffffff' : (tonsFundo[50] || template.corFundo), 'important');

        // Atualiza textos dentro do InstallPrompt
        const textosPrompt = installPrompt.querySelectorAll('h3, p, span, div[class*="text-"]');
        textosPrompt.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (!htmlEl || !htmlEl.classList) return;

          const classes = Array.from(htmlEl.classList);
          // Remove estilos dark e aplica cores do template
          if (classes.some(c => c.includes('dark:text-') || c.includes('text-slate-900') || c.includes('text-white'))) {
            htmlEl.style.setProperty('color', template.corTexto, 'important');
          } else if (classes.some(c => c.includes('text-slate-600') || c.includes('text-slate-300'))) {
            htmlEl.style.setProperty('color', template.corTexto, 'important');
          }
        });
      }
    }
    
    // Atualiza elementos com texto específico
    const textos = document.querySelectorAll('h1, h2, h3, p, span, div[class*="text-"]');
    textos.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (!htmlEl || !htmlEl.classList) return;
      
      const classes = Array.from(htmlEl.classList);
      const temTextoSlate = classes.some(c => c.includes('text-slate-') || c.includes('text-white'));
      
      if (temTextoSlate) {
        // Se tem classe de texto slate, atualiza baseado no tipo do template
        if (classes.some(c => c.includes('text-white'))) {
          htmlEl.style.color = template.corTexto;
        } else if (classes.some(c => c.includes('text-slate-900'))) {
          htmlEl.style.color = template.corTexto;
        } else if (classes.some(c => c.includes('text-slate-400') || c.includes('text-slate-600'))) {
          htmlEl.style.color = template.tipo === 'dark' ? tonsTexto[300] : template.corTexto;
        }
      }
    });
    
  } catch (error) {
    // Erro silencioso
  }
  
  // Aplica estilos inline especificamente em elementos dentro de main para light e custom
  // Isso garante que elementos renderizados dinamicamente também sejam atualizados
  if (template.tipo === 'light' || template.tipo === 'custom') {
    try {
      // Função para aplicar estilos em elementos
      const aplicarEstilosEmElementos = () => {
        const main = document.querySelector('main');
        if (!main) return;
        
        // Seleciona TODOS os elementos que podem ter classes slate, incluindo os que usam classes condicionais
        // Usa querySelectorAll mais abrangente para pegar todos os elementos
        const elementosMain = main.querySelectorAll('*');
        elementosMain.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (!htmlEl) return;
          
          if (!htmlEl.classList) return;
          
          const classes = Array.from(htmlEl.classList);
          
          // PRIMEIRO: Verifica se tem classes bg-slate-800 ou border-slate-700 e aplica diretamente
          // Isso garante que mesmo com estilos inline dark, as cores corretas sejam aplicadas
          const temBgSlate800 = classes.some(c => c.includes('bg-slate-800'));
          const temBgSlate700 = classes.some(c => c.includes('bg-slate-700'));
          const temBgWhite = classes.some(c => c.includes('bg-white'));
          const temBorderSlate700 = classes.some(c => c.includes('border-slate-700'));
          const temBorderSlate200 = classes.some(c => c.includes('border-slate-200'));
          
          // Aplica background baseado nas classes presentes (FORÇA aplicação ANTES de verificar estilos inline)
          if (temBgSlate800) {
            const cor = template.tipo === 'light' ? '#ffffff' : (tonsFundo[800] || template.corFundo);
            htmlEl.style.setProperty('background-color', cor, 'important');
          } else if (temBgSlate700) {
            const cor = template.tipo === 'light' ? '#f1f5f9' : (tonsFundo[700] || template.corFundo);
            htmlEl.style.setProperty('background-color', cor, 'important');
          } else if (temBgWhite) {
            const cor = template.tipo === 'light' ? '#ffffff' : (tonsFundo[50] || template.corFundo);
            htmlEl.style.setProperty('background-color', cor, 'important');
          }
          
          // Aplica border baseado nas classes presentes (FORÇA aplicação ANTES de verificar estilos inline)
          if (temBorderSlate700) {
            const cor = template.tipo === 'light' ? '#cbd5e1' : (tonsFundo[700] || template.corFundo);
            htmlEl.style.setProperty('border-color', cor, 'important');
          } else if (temBorderSlate200) {
            const cor = template.tipo === 'light' ? '#e2e8f0' : (tonsFundo[200] || template.corFundo);
            htmlEl.style.setProperty('border-color', cor, 'important');
          }
          
          // DEPOIS: Verifica se ainda tem cores dark nos estilos inline e força substituição
          const computedStyle = window.getComputedStyle(htmlEl);
          const bgColor = computedStyle.backgroundColor;
          const borderColor = computedStyle.borderColor;
          
          const temBgDark = bgColor && (
            bgColor === 'rgb(0, 0, 0)' || 
            bgColor === 'rgb(15, 23, 42)' || 
            bgColor === 'rgb(30, 41, 59)' || 
            bgColor === 'rgb(2, 0, 24)' ||
            bgColor.includes('rgb(0, 0, 0)') || 
            bgColor.includes('rgb(15, 23, 42)') || 
            bgColor.includes('rgb(30, 41, 59)') || 
            bgColor.includes('rgb(2, 0, 24)')
          );
          
          const temBorderDark = borderColor && (
            borderColor === 'rgb(2, 0, 24)' || 
            borderColor === 'rgb(30, 41, 59)' ||
            borderColor.includes('rgb(2, 0, 24)') || 
            borderColor.includes('rgb(30, 41, 59)')
          );
          
          // Se ainda tem cor dark, força substituição baseada nas classes
          if (temBgDark) {
            if (temBgSlate800) {
              const cor = template.tipo === 'light' ? '#ffffff' : (tonsFundo[800] || template.corFundo);
              htmlEl.style.setProperty('background-color', cor, 'important');
            } else if (temBgSlate700) {
              const cor = template.tipo === 'light' ? '#f1f5f9' : (tonsFundo[700] || template.corFundo);
              htmlEl.style.setProperty('background-color', cor, 'important');
            } else if (temBgWhite) {
              const cor = template.tipo === 'light' ? '#ffffff' : (tonsFundo[50] || template.corFundo);
              htmlEl.style.setProperty('background-color', cor, 'important');
            } else {
              // Se não tem classe específica, usa cor padrão do template
              const cor = template.tipo === 'light' ? '#ffffff' : (tonsFundo[800] || template.corFundo);
              htmlEl.style.setProperty('background-color', cor, 'important');
            }
          }
          
          if (temBorderDark) {
            if (temBorderSlate700) {
              const cor = template.tipo === 'light' ? '#cbd5e1' : (tonsFundo[700] || template.corFundo);
              htmlEl.style.setProperty('border-color', cor, 'important');
            } else if (temBorderSlate200) {
              const cor = template.tipo === 'light' ? '#e2e8f0' : (tonsFundo[200] || template.corFundo);
              htmlEl.style.setProperty('border-color', cor, 'important');
            } else {
              // Se não tem classe específica, usa cor padrão do template
              const cor = template.tipo === 'light' ? '#cbd5e1' : (tonsFundo[700] || template.corFundo);
              htmlEl.style.setProperty('border-color', cor, 'important');
            }
          }
          
          // Aplica estilos baseados nas classes (para garantir que todas sejam processadas)
          classes.forEach((cls: string) => {
            // Background colors - bg-slate-*
            if (cls.includes('bg-slate-') && !cls.includes('dark:')) {
              const match = cls.match(/bg-slate-(\d+)/);
              if (match) {
                const ton = match[1];
                let cor: string;
                if (template.tipo === 'light') {
                  const mapeamentoLight: { [key: string]: string } = {
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
                  cor = mapeamentoLight[ton] || '#ffffff';
                } else {
                  const tonKey = ton as keyof typeof tonsFundo;
                  cor = tonsFundo[tonKey] || template.corFundo;
                }
                htmlEl.style.setProperty('background-color', cor, 'important');
              } else if (cls.includes('bg-white')) {
                const cor = template.tipo === 'light' ? '#ffffff' : (tonsFundo[50] || template.corFundo);
                htmlEl.style.setProperty('background-color', cor, 'important');
              }
            }
            
            // Border colors - border-slate-*
            if (cls.includes('border-slate-') && !cls.includes('dark:')) {
              const match = cls.match(/border-slate-(\d+)/);
              if (match) {
                const ton = match[1];
                let cor: string;
                if (template.tipo === 'light') {
                  const mapeamentoLight: { [key: string]: string } = {
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
                  cor = mapeamentoLight[ton] || '#e2e8f0';
                } else {
                  const tonKey = ton as keyof typeof tonsFundo;
                  if (ton === '700' || ton === '800') {
                    cor = tonsFundo[700] || tonsFundo[800] || template.corFundo;
                  } else if (ton === '200' || ton === '300') {
                    cor = tonsFundo[200] || tonsFundo[300] || template.corFundo;
                  } else {
                    cor = tonsFundo[tonKey] || template.corFundo;
                  }
                }
                htmlEl.style.setProperty('border-color', cor, 'important');
              }
            }
          });
        });
      };
      
      // Aplica imediatamente
      aplicarEstilosEmElementos();
      
      // Aguarda um pouco e aplica novamente para garantir que elementos renderizados dinamicamente sejam atualizados
      setTimeout(() => {
        aplicarEstilosEmElementos();
      }, 10);
      
      // Aplica novamente após mais tempo para garantir que todos os elementos foram renderizados
      setTimeout(() => {
        aplicarEstilosEmElementos();
      }, 100);
      
      // Aplica novamente após mais tempo
      setTimeout(() => {
        aplicarEstilosEmElementos();
      }, 300);
      
      // Aplica uma última vez após mais tempo para garantir que tudo foi atualizado
      setTimeout(() => {
        aplicarEstilosEmElementos();
      }, 600);
    } catch (error) {
      // Erro silencioso
    }
  }
}
