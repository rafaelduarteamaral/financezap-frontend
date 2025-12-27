# Desenvolvimento Local do Frontend

## Configuração

1. **Criar arquivo `.env.local`**:
   ```bash
   cp .env.local.example .env.local
   ```

2. **Ajustar a URL do backend** no `.env.local`:
   - Para desenvolvimento local: `VITE_API_URL=http://localhost:8787`
   - Para usar backend em produção: `VITE_API_URL=https://financezap.rafael-damaral.workers.dev`

## Executar

```bash
npm run dev
```

O frontend estará disponível em: `http://localhost:5173`

## Notas

- O arquivo `.env.local` não é versionado (está no `.gitignore`)
- As variáveis começam com `VITE_` para serem expostas ao código do frontend
- Em produção, o frontend usa automaticamente a URL do backend em produção

