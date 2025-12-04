// Script simples para gerar ícones PWA
// Requer: npm install sharp (ou usar uma ferramenta online)

const fs = require('fs');
const path = require('path');

// Cores e configurações do ícone
const iconConfig = {
  sizes: [192, 512],
  backgroundColor: '#00C853', // Cor tema (Verde Brand)
  text: '💰', // Emoji ou texto
};

console.log('📱 Gerando ícones PWA...');
console.log('');
console.log('Para gerar os ícones, você pode:');
console.log('1. Usar uma ferramenta online como: https://realfavicongenerator.net/');
console.log('2. Usar o PWA Asset Generator: https://github.com/elegantapp/pwa-asset-generator');
console.log('3. Criar manualmente imagens PNG de 192x192 e 512x512 pixels');
console.log('');
console.log('Os ícones devem ser salvos em:');
console.log('- public/icon-192.png (192x192 pixels)');
console.log('- public/icon-512.png (512x512 pixels)');
console.log('');
console.log('💡 Dica: Você pode usar o logo do FinanceZap ou criar um ícone simples');
console.log('   com a cor tema (#00C853 - Verde Brand) e um símbolo de dinheiro/gráfico.');

