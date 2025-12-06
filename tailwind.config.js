/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Habilita dark mode via classe
  theme: {
    extend: {
      colors: {
        // 🌱 Cores principais da marca
        brand: {
          DEFAULT: "#00C853", // Verde principal
          light: "#69F0AE",   // Verde mais claro (hover, backgrounds suaves)
          dark: "#00953D",    // Verde mais escuro (borders, foco)
        },

        // 🟡 Ouro / destaque financeiro
        gold: {
          DEFAULT: "#E5C07B",
          light: "#F3D9A4",
          dark: "#B39553",
          50: '#faf7ed',
          100: '#f5efdb',
          200: '#ebdfb7',
          300: '#e1cf93',
          400: '#d7bf6f',
          500: '#E5C07B',
          600: '#B39553',
          700: '#806921',
          800: '#554616',
          900: '#2a230b',
        },

        // ⚫ Neutros para fundo / textos / cards
        neutral: {
          950: "#050505",
          900: "#121212", // grafite (background principal dark)
          800: "#1E1E1E",
          700: "#2D2D2D", // cards escuros
          600: "#3C3C3C",
          500: "#6E6E6E",
          400: "#9E9E9E",
          300: "#C4C4C4",
          200: "#DCDCDC",
          100: "#EDEDED", // fundo claro
          50:  "#F7F7F7", // quase branco
        },
        
        // Slate com variáveis CSS dinâmicas para templates
        slate: {
          50: 'var(--color-slate-50, #F7F7F7)',
          100: 'var(--color-slate-100, #EDEDED)',
          200: 'var(--color-slate-200, #DCDCDC)',
          300: 'var(--color-slate-300, #C4C4C4)',
          400: 'var(--color-slate-400, #9E9E9E)',
          500: 'var(--color-slate-500, #6E6E6E)',
          600: 'var(--color-slate-600, #3C3C3C)',
          700: 'var(--color-slate-700, #2D2D2D)',
          800: 'var(--color-slate-800, #1E1E1E)',
          900: 'var(--color-slate-900, #121212)',
          950: 'var(--color-slate-950, #050505)',
        },

        // 🎯 Cores de status (dashboard financeiro, alertas, etc.)
        status: {
          success: "#00C853", // pode usar igual brand
          warning: "#FFB400",
          danger:  "#E53935",
          info:    "#0288D1",
        },

        // 🧊 Extras tecnológicos (pra detalhes, gráficos, etc.)
        tech: {
          cyan: "#00F5D4",
          blue: "#0A2342",
        },

        // Mantém primary para compatibilidade com código existente
        // Usa variáveis CSS dinâmicas para permitir mudança de templates
        primary: {
          DEFAULT: 'var(--color-primary-500, #00C853)',
          light: 'var(--color-primary-light, #69F0AE)',
          dark: 'var(--color-primary-dark, #00953D)',
          50: 'var(--color-primary-50, #e6f5eb)',
          100: 'var(--color-primary-100, #ccebd7)',
          200: 'var(--color-primary-200, #99d7af)',
          300: 'var(--color-primary-300, #66c387)',
          400: 'var(--color-primary-400, #33af5f)',
          500: 'var(--color-primary-500, #00C853)',
          600: 'var(--color-primary-600, #00953D)',
          700: 'var(--color-primary-700, #00782d)',
          800: 'var(--color-primary-800, #005922)',
          900: 'var(--color-primary-900, #003a17)',
        },
      },
    },
  },
  plugins: [],
}

