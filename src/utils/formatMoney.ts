import { useState } from 'react';

/**
 * Formata um valor numérico para formato de moeda brasileira (R$)
 * Exemplo: 1234.56 -> "1.234,56"
 */
export function formatarMoeda(valor: number | string): string {
  if (valor === null || valor === undefined || valor === '') return '0,00';
  
  const num = typeof valor === 'string' ? parseFloat(valor.replace(/[^\d,.-]/g, '').replace(',', '.')) : valor;
  
  if (isNaN(num)) return '0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Converte uma string formatada em moeda para número
 * Exemplo: "1.234,56" -> 1234.56
 * Exemplo: "1.000,00" -> 1000.00
 */
export function parseMoeda(valorFormatado: string): number {
  if (!valorFormatado) return 0;
  
  // Remove tudo exceto números, vírgula e ponto
  let limpo = valorFormatado.replace(/[^\d,.-]/g, '');
  
  // Se tem vírgula, assume formato brasileiro (1.234,56)
  // Remove pontos de milhar e substitui vírgula por ponto
  if (limpo.includes(',')) {
    // Remove todos os pontos (são pontos de milhar)
    limpo = limpo.replace(/\./g, '');
    // Substitui vírgula por ponto para parseFloat
    limpo = limpo.replace(',', '.');
  } else if (limpo.includes('.')) {
    // Se tem ponto mas não vírgula, pode ser formato americano (1234.56)
    // Mas também pode ser formato brasileiro sem vírgula (1.000)
    // Vamos assumir que se tem mais de um ponto, são pontos de milhar
    const pontos = limpo.match(/\./g)?.length || 0;
    if (pontos > 1) {
      // Múltiplos pontos = pontos de milhar, remove todos
      limpo = limpo.replace(/\./g, '');
    }
    // Se tem apenas um ponto, mantém como decimal
  }
  
  const parsed = parseFloat(limpo);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Aplica máscara de dinheiro enquanto o usuário digita
 * Trata o valor como reais (não divide por 100)
 * Exemplo: "1" -> "1,00"
 * Exemplo: "12" -> "12,00"
 * Exemplo: "1234" -> "1.234,00"
 */
export function aplicarMascaraDinheiro(valor: string): string {
  if (!valor || valor.trim() === '') return '';

  // Remove qualquer formatação prévia (pontos, vírgulas, etc)
  const apenasNumeros = valor.replace(/\D/g, '');
  if (apenasNumeros === '') return '';

  // Converte para número (tratando como reais, não centavos)
  const numero = Number(apenasNumeros);
  if (isNaN(numero) || numero < 0) return '';

  // Formata com 2 casas decimais
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numero);
}

/**
 * Hook para usar máscara de dinheiro em inputs
 * Retorna valor formatado e função para atualizar
 */
export function useMascaraDinheiro(valorInicial: string = '') {
  const [valorFormatado, setValorFormatado] = useState(valorInicial);
  
  const atualizarValor = (novoValor: string) => {
    const formatado = aplicarMascaraDinheiro(novoValor);
    setValorFormatado(formatado);
    return formatado;
  };
  
  const obterValorNumerico = (): number => {
    return parseMoeda(valorFormatado);
  };
  
  return {
    valorFormatado,
    atualizarValor,
    obterValorNumerico,
    setValorFormatado,
  };
}
