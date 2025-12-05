# 🎨 Gerar Ícones PNG do Logo

O logo SVG (`/public/logo.svg`) já está configurado como favicon e ícone do sistema. Navegadores modernos suportam SVG diretamente.

## Opção 1: Usar SVG diretamente (Recomendado)

O SVG já está configurado e funcionando! Navegadores modernos suportam SVG como favicon e ícones PWA.

## Opção 2: Gerar PNGs (Opcional)

Se precisar gerar PNGs em diferentes tamanhos (para compatibilidade com alguns dispositivos):

1. **Instale a dependência:**
```bash
npm install sharp --save-dev
```

2. **Execute o script:**
```bash
npm run gerar-icones
```

Isso gerará os seguintes arquivos PNG na pasta `public/`:
- `icon-72.png`
- `icon-96.png`
- `icon-128.png`
- `icon-144.png`
- `icon-152.png`
- `icon-192.png`
- `icon-384.png`
- `icon-512.png`

3. **Atualize o manifest.json** (se necessário) para usar os PNGs:
```json
{
  "icons": [
    {
      "src": "/logo.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    },
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## ✅ Status Atual

- ✅ SVG configurado como favicon
- ✅ SVG configurado no manifest.json
- ✅ SVG configurado nos Apple Touch Icons
- ✅ Theme color atualizado para verde do logo (#10b981)

