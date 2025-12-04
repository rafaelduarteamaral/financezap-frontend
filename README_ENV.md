# Configuração de Variáveis de Ambiente

## Como configurar a URL do backend

### 1. Criar arquivo `.env` na raiz do frontend

Crie um arquivo `.env` na pasta `frontend-financezap/` com o seguinte conteúdo:

```env
# Para desenvolvimento local
VITE_API_URL=http://localhost:3000
```

### 2. Para produção

Crie um arquivo `.env.production` ou configure a variável de ambiente no seu serviço de deploy:

```env
# Para produção - substitua pela URL completa do seu backend
VITE_API_URL=https://seu-servidor-backend.com
```

### 3. Variáveis de ambiente no deploy

#### Cloudflare Pages:
- Vá em Settings > Environment Variables
- Adicione: `VITE_API_URL` = `https://seu-backend.com`

#### Vercel:
- Vá em Settings > Environment Variables
- Adicione: `VITE_API_URL` = `https://seu-backend.com`
- Selecione "Production" no ambiente

#### Netlify:
- Vá em Site settings > Environment variables
- Adicione: `VITE_API_URL` = `https://seu-backend.com`

### 4. Rebuild após mudanças

Após alterar variáveis de ambiente, você precisa fazer rebuild:

```bash
npm run build
```

### Importante:
- Variáveis de ambiente no Vite precisam começar com `VITE_`
- O arquivo `.env` não deve ser commitado no Git (já está no .gitignore)
- Use `.env.production` para variáveis específicas de produção
- Use `.env.local` para variáveis locais que não devem ser commitadas

