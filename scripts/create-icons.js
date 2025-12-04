#!/usr/bin/env node

/**
 * Script para criar ícones PWA básicos
 * 
 * Opção 1: Instalar dependências e executar
 *   npm install sharp
 *   node scripts/create-icons.js
 * 
 * Opção 2: Usar ferramenta online
 *   https://realfavicongenerator.net/
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const sizes = [192, 512];

console.log('📱 Gerador de Ícones PWA para FinanceZap\n');

// Verifica se sharp está instalado
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('❌ A biblioteca "sharp" não está instalada.');
  console.log('\n📦 Para instalar e gerar os ícones automaticamente:');
  console.log('   npm install sharp');
  console.log('   node scripts/create-icons.js');
  console.log('\n🌐 Ou use uma ferramenta online:');
  console.log('   https://realfavicongenerator.net/');
  console.log('   https://www.pwabuilder.com/imageGenerator');
  console.log('\n📝 Os ícones devem ser salvos em:');
  sizes.forEach(size => {
    console.log(`   public/icon-${size}.png (${size}x${size} pixels)`);
  });
  process.exit(0);
}

// Cria um ícone simples com cor tema
async function createIcon(size) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#00C853" rx="${size * 0.2}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" 
            font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">
        💰
      </text>
    </svg>
  `;

  const outputPath = path.join(publicDir, `icon-${size}.png`);
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);
  
  console.log(`✅ Criado: icon-${size}.png`);
}

async function main() {
  console.log('🎨 Criando ícones PWA...\n');
  
  for (const size of sizes) {
    await createIcon(size);
  }
  
  console.log('\n✨ Ícones criados com sucesso!');
  console.log('📱 O PWA está pronto para ser instalado.');
}

main().catch(console.error);

