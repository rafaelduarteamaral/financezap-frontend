/**
 * Capitaliza a primeira letra de uma string
 * Exemplo: "comida" -> "Comida", "alimentação" -> "Alimentação"
 */
export function capitalize(str: string): string {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Capitaliza a primeira letra de cada palavra
 * Exemplo: "alimentação e bebida" -> "Alimentação E Bebida"
 */
export function capitalizeWords(str: string): string {
  if (!str || str.length === 0) return str;
  return str
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

