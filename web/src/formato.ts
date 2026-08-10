// Formatação de valores para exibição.
//
// Os formatadores do Intl e a tabela de faixas vivem no escopo do módulo, e
// não dentro das funções: construir um Intl.NumberFormat custa (ele faz o
// parse do locale e das opções). Como formatarPreco roda uma vez por card,
// criá-lo a cada chamada seria repetir esse custo à toa. Construído uma vez
// aqui, reusamos só o .format().

const MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const RELATIVO = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

// Faixas de tempo: até 60s use segundos, até 1h use minutos, e assim por diante.
const FAIXAS: [limite: number, divisor: number, unidade: Intl.RelativeTimeFormatUnit][] = [
  [60, 1, 'second'],
  [3600, 60, 'minute'],
  [86400, 3600, 'hour'],
  [604800, 86400, 'day'],
  [2629800, 604800, 'week'],
  [31557600, 2629800, 'month'],
];

/** Doação vira o texto "Doação"; venda vira "R$ 80,00". */
export function formatarPreco(preco: number | null): string {
  if (preco === null) return 'Doação';

  return MOEDA.format(preco);
}

/** Converte uma data ISO em algo como "há 3 horas". */
export function formatarQuando(iso: string): string {
  const segundos = (Date.now() - new Date(iso).getTime()) / 1000;

  for (const [limite, divisor, unidade] of FAIXAS) {
    if (segundos < limite) {
      return RELATIVO.format(-Math.floor(segundos / divisor), unidade);
    }
  }

  return RELATIVO.format(-Math.floor(segundos / 31557600), 'year');
}
