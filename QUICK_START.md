# ⚡ Quick Start - Desenvolvimento Local

## 🚀 Setup Rápido (1 minuto)

```bash
# 1. Execute o script de setup
./setup-local.sh

# 2. Inicie o servidor de desenvolvimento
npm run dev

# 3. Acesse http://localhost:5173
```

## 📝 Configuração Manual

Se preferir configurar manualmente:

```bash
# 1. Instalar dependências
npm install

# 2. Criar arquivo .env.local
cp env.local.example .env.local

# 3. Iniciar servidor
npm run dev
```

## ✅ O que está configurado?

- ✅ Frontend local conectado à API de produção (`https://api.usezela.com`)
- ✅ Usa banco de dados de produção
- ✅ Hot reload ativado
- ✅ Debug habilitado no console

## 🔄 Fluxo de Trabalho

1. **Criar branch:**
   ```bash
   git checkout -b feature/nome-da-feature
   ```

2. **Desenvolver:**
   ```bash
   npm run dev
   ```

3. **Testar:** Acesse http://localhost:5173

4. **Commitar:**
   ```bash
   git add .
   git commit -m "feat: descrição"
   git push
   ```

## 📚 Mais Informações

Consulte `README_DESENVOLVIMENTO.md` para detalhes completos.

