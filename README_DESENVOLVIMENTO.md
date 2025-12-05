# 🚀 Guia de Desenvolvimento Local

Este guia explica como configurar o ambiente local para desenvolver o frontend usando o banco de dados de produção.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Acesso ao repositório do projeto

## ⚙️ Configuração Inicial

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e configure:

```bash
cp .env.local.example .env.local
```

O arquivo `.env.local` já está configurado para usar a API de produção (`https://api.usezela.com`).

**Importante:** O arquivo `.env.local` não é commitado no git (está no .gitignore), então cada desenvolvedor precisa criar o seu.

### 3. Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

O frontend estará disponível em `http://localhost:5173`

## 🔧 Configurações Disponíveis

### Usar API de Produção (Padrão)

```env
VITE_API_URL=https://api.usezela.com
```

**Vantagens:**
- ✅ Usa dados reais de produção
- ✅ Não precisa rodar backend localmente
- ✅ Testa com dados reais

**Desvantagens:**
- ⚠️ Alterações afetam dados de produção
- ⚠️ Precisa de autenticação válida

### Usar API Local (Opcional)

Se você quiser rodar o backend localmente também:

```env
VITE_API_URL=http://localhost:3000
```

## 📝 Fluxo de Trabalho Recomendado

### 1. Criar Branch para Nova Feature

```bash
git checkout -b feature/nome-da-feature
```

### 2. Desenvolver Localmente

- Faça suas alterações no código
- Teste localmente com `npm run dev`
- Use a API de produção para testar com dados reais

### 3. Commitar Alterações

```bash
git add .
git commit -m "feat: descrição da feature"
```

### 4. Fazer Push e Criar Pull Request

```bash
git push origin feature/nome-da-feature
```

## 🎯 Estrutura de Branches

- `main` - Código em produção
- `develop` - Código em desenvolvimento (se aplicável)
- `feature/*` - Novas features
- `fix/*` - Correções de bugs
- `hotfix/*` - Correções urgentes

## 🐛 Debugging

### Ver URL da API sendo usada

O console do navegador mostrará:
```
🔧 API_BASE_URL: https://api.usezela.com
🔧 VITE_API_URL do env: https://api.usezela.com
```

### Problemas Comuns

**Erro de CORS:**
- Verifique se a API de produção está configurada para aceitar requisições de `localhost:5173`

**Erro 401 (Não autorizado):**
- Faça login novamente no frontend local
- Verifique se o token está sendo salvo corretamente

**Alterações não aparecem:**
- Limpe o cache do navegador
- Reinicie o servidor de desenvolvimento (`Ctrl+C` e `npm run dev` novamente)

## 📦 Build para Produção

Para testar o build de produção localmente:

```bash
npm run build
npm run preview
```

## 🔐 Segurança

⚠️ **IMPORTANTE:**
- Nunca commite o arquivo `.env.local` (já está no .gitignore)
- Não compartilhe tokens ou credenciais
- Use variáveis de ambiente para dados sensíveis

## 📚 Recursos Adicionais

- [Documentação do Vite](https://vitejs.dev/)
- [Documentação do React](https://react.dev/)
- [Documentação do Tailwind CSS](https://tailwindcss.com/)

