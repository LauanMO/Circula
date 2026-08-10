// Formatação de valores para exibição.

/** Doação vira o texto "Doação"; venda vira "R$ 80,00". */
export function formatarPreco(preco: number | null): string {
  if (preco === null) return 'Doação';

  return preco.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

const RELATIVO = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

/** Converte uma data ISO em algo como "há 3 horas". */
export function formatarQuando(iso: string): string {
  const segundos = (Date.now() - new Date(iso).getTime()) / 1000;

  const faixas: [limite: number, divisor: number, unidade: Intl.RelativeTimeFormatUnit][] = [
    [60, 1, 'second'],
    [3600, 60, 'minute'],
    [86400, 3600, 'hour'],
    [604800, 86400, 'day'],
    [2629800, 604800, 'week'],
    [31557600, 2629800, 'month'],
  ];

  for (const [limite, divisor, unidade] of faixas) {
    if (segundos < limite) {
      return RELATIVO.format(-Math.floor(segundos / divisor), unidade);
    }
  }

  return RELATIVO.format(-Math.floor(segundos / 31557600), 'year');
}
