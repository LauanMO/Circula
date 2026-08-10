// Ícones em SVG inline.
//
// Escritos à mão em vez de instalar uma biblioteca de ícones: são cinco
// desenhos simples e assim o projeto não carrega um pacote inteiro para usar
// meia dúzia deles. Todos herdam a cor do texto via `currentColor`.

type Props = { className?: string };

const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function IconeCasa({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}

export function IconeMais({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

export function IconeEtiqueta({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M3 12V4h8l10 10-8 8L3 12Z" />
      <circle cx="7.5" cy="7.5" r="1.4" />
    </svg>
  );
}

export function IconeLixeira({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
    </svg>
  );
}

export function IconeReciclar({ className }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M7 19H5a2 2 0 0 1-1.7-3l1.5-2.5" />
      <path d="m12 4 1.8 3M12 4l-3 1.7M12 4l1.8 3" />
      <path d="M19.6 13.4 21 16a2 2 0 0 1-1.7 3H16" />
      <path d="m4.5 11 2-3.5M17 19l-2.2 2M17 19l-2.2-2" />
    </svg>
  );
}
