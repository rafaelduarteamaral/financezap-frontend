# Como Criar os Ícones do PWA

Para criar os ícones necessários para o PWA, você pode usar uma das seguintes opções:

## Opção 1: Usar um Gerador Online (Recomendado)

1. Acesse: https://realfavicongenerator.net/ ou https://www.pwabuilder.com/imageGenerator
2. Faça upload de uma imagem quadrada (mínimo 512x512px)
3. Baixe os ícones gerados
4. Coloque os arquivos na pasta `public/`:
   - icon-72.png
   - icon-96.png
   - icon-128.png
   - icon-144.png
   - icon-152.png
   - icon-192.png
   - icon-384.png
   - icon-512.png

## Opção 2: Criar Manualmente

Use uma ferramenta de edição de imagens (Photoshop, GIMP, Figma, etc.) para criar:
- Uma imagem quadrada com o logo do FinanceZap
- Cor de fundo: #00C853 (verde)
- Exporte em múltiplos tamanhos: 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

## Opção 3: Usar um SVG Temporário

Por enquanto, você pode usar o vite.svg existente como placeholder.
Os ícones serão gerados automaticamente quando você criar os arquivos PNG.

## Tamanhos Necessários

- 72x72px - Android
- 96x96px - Android
- 128x128px - Chrome
- 144x144px - Windows
- 152x152px - iOS
- 192x192px - Android (mínimo recomendado)
- 384x384px - Android
- 512x512px - Android (recomendado para splash screen)

## Dica

O ícone deve ter:
- Fundo sólido ou transparente
- Logo centralizado
- Boa visibilidade em tamanhos pequenos
- Cores que contrastem bem com fundos claros e escuros
