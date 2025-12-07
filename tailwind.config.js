/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Tema de cores baseado no design fornecido
        primary: {
          // Verde lima/chartreuse (primário)
          DEFAULT: 'hsl(80, 75%, 55%)',
          50: 'hsl(80, 75%, 95%)',
          100: 'hsl(80, 75%, 90%)',
          200: 'hsl(80, 75%, 80%)',
          300: 'hsl(80, 75%, 70%)',
          400: 'hsl(80, 75%, 60%)',
          500: 'hsl(80, 75%, 55%)',
          600: 'hsl(80, 75%, 45%)',
          700: 'hsl(80, 60%, 40%)', // Verde oliva
          800: 'hsl(80, 60%, 35%)',
          900: 'hsl(80, 60%, 30%)',
        },
        teal: {
          // Verde escuro/teal
          DEFAULT: 'hsl(160, 70%, 25%)',
          50: 'hsl(160, 70%, 95%)',
          100: 'hsl(160, 70%, 90%)',
          200: 'hsl(160, 70%, 80%)',
          300: 'hsl(160, 70%, 70%)',
          400: 'hsl(160, 70%, 60%)',
          500: 'hsl(160, 70%, 50%)',
          600: 'hsl(160, 70%, 40%)',
          700: 'hsl(160, 70%, 30%)',
          800: 'hsl(160, 70%, 25%)',
          900: 'hsl(160, 70%, 20%)',
        },
        mint: {
          // Verde menta suave
          DEFAULT: 'hsl(140, 50%, 95%)',
          50: 'hsl(140, 50%, 98%)',
          100: 'hsl(140, 50%, 96%)',
          200: 'hsl(140, 50%, 95%)',
          300: 'hsl(140, 50%, 90%)',
          400: 'hsl(140, 50%, 85%)',
        },
        gray: {
          // Cores de cinza customizadas
          light: 'hsl(120, 10%, 96%)', // Cinza claro - fundos de cards sutis
          DEFAULT: 'hsl(220, 10%, 50%)', // Cinza médio - textos secundários
          dark: 'hsl(220, 15%, 20%)', // Cinza escuro - textos principais
        },
        white: {
          DEFAULT: 'hsl(0, 0%, 100%)', // Branco puro
        },
      },
    },
  },
  plugins: [],
}
