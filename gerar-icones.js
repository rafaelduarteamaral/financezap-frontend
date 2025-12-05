#!/usr/bin/env node

/**
 * Script para gerar ícones PNG em diferentes tamanhos a partir do logo.svg
 * 
 * Requer: npm install sharp --save-dev
 * 
 * Uso: node gerar-icones.js
 */

const fs = require('fs');
const path = require('path');

// Tamanhos de ícones necessários
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function gerarIcones() {
  try {
    // Verifica se sharp está instalado
    let sharp;
    try {
      sharp = require('sharp');
    } catch (e) {
      console.error('❌ Erro: sharp não está instalado.');
      console.log('📦 Instale com: npm install sharp --save-dev');
      process.exit(1);
    }

    const svgPath = path.join(__dirname, 'public', 'logo.svg');
    const outputDir = path.join(__dirname, 'public');

    if (!fs.existsSync(svgPath)) {
      console.error(`❌ Arquivo não encontrado: ${svgPath}`);
      process.exit(1);
    }

    console.log('🎨 Gerando ícones PNG a partir do logo.svg...\n');

    // Lê o SVG
    const svgBuffer = fs.readFileSync(svgPath);

    // Gera cada tamanho
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}.png`);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✅ Gerado: icon-${size}.png (${size}x${size})`);
    }

    console.log('\n✨ Todos os ícones foram gerados com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Atualize o manifest.json para usar os PNGs gerados');
    console.log('2. Atualize o index.html com os novos ícones');
    
  } catch (error) {
    console.error('❌ Erro ao gerar ícones:', error.message);
    process.exit(1);
  }
}

gerarIcones();

