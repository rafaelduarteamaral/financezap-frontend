/**
 * Formata um número de telefone brasileiro
 * @param value - String contendo apenas números
 * @returns String formatada como (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export function formatPhone(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos (celular) ou 10 dígitos (fixo)
  const limitedNumbers = numbers.slice(0, 11);
  
  // Aplica a formatação
  if (limitedNumbers.length <= 2) {
    // Apenas DDD
    return limitedNumbers.length > 0 ? `(${limitedNumbers}` : '';
  } else if (limitedNumbers.length <= 6) {
    // DDD + parte inicial
    const ddd = limitedNumbers.slice(0, 2);
    const parte1 = limitedNumbers.slice(2);
    return `(${ddd}) ${parte1}`;
  } else if (limitedNumbers.length <= 10) {
    // Telefone fixo: (XX) XXXX-XXXX
    const ddd = limitedNumbers.slice(0, 2);
    const parte1 = limitedNumbers.slice(2, 6);
    const parte2 = limitedNumbers.slice(6);
    return `(${ddd}) ${parte1}-${parte2}`;
  } else {
    // Celular: (XX) XXXXX-XXXX
    const ddd = limitedNumbers.slice(0, 2);
    const parte1 = limitedNumbers.slice(2, 7);
    const parte2 = limitedNumbers.slice(7);
    return `(${ddd}) ${parte1}-${parte2}`;
  }
}

/**
 * Remove a formatação do telefone, retornando apenas números
 * @param value - String formatada ou não
 * @returns String contendo apenas números
 */
export function unformatPhone(value: string): string {
  return value.replace(/\D/g, '');
}

