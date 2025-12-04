# 🔧 Troubleshooting - Variáveis de Ambiente

## Problema: Ainda está usando `localhost:3000` mesmo após criar `.env`

### Solução 1: Reiniciar o servidor de desenvolvimento

O Vite **só carrega variáveis de ambiente na inicialização**. Você **DEVE** reiniciar o servidor:

1. **Pare o servidor atual** (Ctrl+C ou Cmd+C no terminal)
2. **Limpe o cache do Vite** (opcional mas recomendado):
   ```bash
   rm -rf node_modules/.vite
   ```
3. **Inicie o servidor novamente**:
   ```bash
   npm run dev
   ```

### Solução 2: Verificar se o `.env` está correto

Certifique-se de que o arquivo `.env` está na raiz do projeto `frontend-financezap/`:

```bash
cd frontend-financezap
cat .env
```

Deve mostrar:
```
VITE_API_URL=https://seu-servidor-backend.com
```

### Solução 3: Verificar no console do navegador

Após reiniciar o servidor, abra o DevTools (F12) e verifique no console:

```
🔧 API_BASE_URL: https://seu-servidor-backend.com
🔧 VITE_API_URL do env: https://seu-servidor-backend.com
```

Se aparecer `undefined` ou `http://localhost:3000`, significa que:
- O servidor não foi reiniciado
- O arquivo `.env` não está sendo lido
- Há um erro de sintaxe no `.env`

### Solução 4: Limpar cache completo

Se ainda não funcionar, limpe tudo:

```bash
# Limpar cache do Vite
rm -rf node_modules/.vite

# Limpar cache do navegador (ou use modo anônimo)
# Chrome/Edge: Ctrl+Shift+Delete
# Firefox: Ctrl+Shift+Delete

# Reinstalar dependências (último recurso)
rm -rf node_modules
npm install
npm run dev
```

### Solução 5: Verificar sintaxe do `.env`

O arquivo `.env` deve ter:
- **Sem espaços** ao redor do `=`
- **Sem aspas** (a menos que necessário)
- **Sem comentários na mesma linha**

✅ **Correto:**
```
VITE_API_URL=https://api.seudominio.com
```

❌ **Incorreto:**
```
VITE_API_URL = https://api.seudominio.com  # Com espaços
VITE_API_URL="https://api.seudominio.com"  # Com aspas (desnecessário)
VITE_API_URL=https://api.seudominio.com # comentário aqui  # Comentário na mesma linha
```

### Para Produção

Quando fizer o build para produção:

1. **Crie `.env.production`**:
   ```bash
   echo "VITE_API_URL=https://seu-servidor-backend.com" > .env.production
   ```

2. **Ou configure no serviço de deploy** (Cloudflare Pages, Vercel, etc.):
   - Vá em Settings > Environment Variables
   - Adicione: `VITE_API_URL` = `https://seu-servidor-backend.com`

3. **Faça o build**:
   ```bash
   npm run build
   ```

### Checklist

- [ ] Arquivo `.env` existe na pasta `frontend-financezap/`
- [ ] Arquivo `.env` tem a sintaxe correta (sem espaços, sem aspas)
- [ ] Servidor foi **reiniciado** após criar/modificar `.env`
- [ ] Cache do Vite foi limpo (`rm -rf node_modules/.vite`)
- [ ] Console do navegador mostra a URL correta
- [ ] Para produção: `.env.production` criado ou variável configurada no deploy

