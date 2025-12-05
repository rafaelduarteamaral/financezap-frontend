#!/bin/bash

echo "🚀 Configurando ambiente de desenvolvimento local..."
echo ""

# Verifica se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Por favor, instale Node.js 18+ primeiro."
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"
echo ""

# Instala dependências
echo "📦 Instalando dependências..."
npm install

echo ""

# Cria arquivo .env.local se não existir
if [ ! -f .env.local ]; then
    echo "📝 Criando arquivo .env.local..."
    cp env.local.example .env.local
    echo "✅ Arquivo .env.local criado com sucesso!"
    echo "   Configurado para usar API de produção: https://api.usezela.com"
else
    echo "ℹ️  Arquivo .env.local já existe, mantendo configuração atual"
fi

echo ""
echo "✨ Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Execute: npm run dev"
echo "   2. Acesse: http://localhost:5173"
echo "   3. O frontend estará conectado à API de produção"
echo ""
echo "📚 Para mais informações, consulte README_DESENVOLVIMENTO.md"

