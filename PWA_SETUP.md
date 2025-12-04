# Configuração PWA - FinanceZap

O FinanceZap já está configurado como PWA! Para completar a instalação, você precisa criar os ícones.

## Ícones Necessários

Crie dois arquivos PNG na pasta `public/`:

1. **icon-192.png** - 192x192 pixels
2. **icon-512.png** - 512x512 pixels

## Como Gerar os Ícones

### Opção 1: Usar Ferramenta Online (Recomendado)

1. Acesse: https://realfavicongenerator.net/
2. Faça upload de uma imagem (logo ou ícone do FinanceZap)
3. Configure as opções
4. Baixe os ícones e coloque em `public/`

### Opção 2: Usar PWA Asset Generator

```bash
npx pwa-asset-generator logo.png public/icon --icon-only
```

### Opção 3: Criar Manualmente

Use qualquer editor de imagens (Photoshop, GIMP, Figma, etc.) para criar:
- Um ícone de 192x192 pixels
- Um ícone de 512x512 pixels

Salve como `icon-192.png` e `icon-512.png` na pasta `public/`

## Testando o PWA

1. Execute o build: `npm run build`
2. Execute o preview: `npm run preview`
3. Abra no navegador (Chrome/Edge recomendado)
4. No menu do navegador, procure por "Instalar app" ou "Add to Home Screen"
5. No mobile, você verá um prompt para instalar o app

## Funcionalidades PWA

✅ Manifest configurado
✅ Service Worker registrado
✅ Cache de recursos
✅ Funcionamento offline básico
✅ Instalável no celular

## Notas

- O Service Worker usa estratégia "Network First" com fallback para cache
- Os recursos são cacheados automaticamente
- O app funciona offline após a primeira visita

