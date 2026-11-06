// Iconos de línea. Heredan el color del texto (currentColor).

const BASE = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export function IconoInicio() {
  return (
    <svg {...BASE}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </svg>
  )
}

export function IconoMovimientos() {
  return (
    <svg {...BASE}>
      <rect x="3" y="5.5" width="18" height="14" rx="3" />
      <path d="M3 9.5h18M15.5 14.5h2" />
    </svg>
  )
}

export function IconoDiagnostico() {
  return (
    <svg {...BASE}>
      <circle cx="12" cy="5" r="2" />
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="19" r="2" />
      <path d="M12 7v4M12 11l-6 6M12 11l6 6" />
    </svg>
  )
}

export function IconoPlan() {
  return (
    <svg {...BASE}>
      <path d="M3 17l5.5-5.5 4 4L21 7" />
      <path d="M15 7h6v6" />
    </svg>
  )
}

export function IconoFlujo() {
  return (
    <svg {...BASE}>
      <path d="M3 7h6c3 0 3 10 6 10h6" />
      <path d="M3 17h6c3 0 3-10 6-10h6" />
    </svg>
  )
}

export function IconoTabla() {
  return (
    <svg {...BASE}>
      <path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-2.5-1.5-2.5 1.5-2.5-1.5-2.5 1.5-2.5-1.5-1 .6V4.5a1 1 0 0 1 1-1Z" />
      <path d="M9 8.5h6M9 12h6" />
    </svg>
  )
}

export function IconoReglas() {
  return (
    <svg {...BASE}>
      <path d="M4.5 5.5a2 2 0 0 1 2-2h12v15h-12a2 2 0 0 0-2 2v-15Z" />
      <path d="M4.5 20.5a2 2 0 0 1 2-2h12v2" />
    </svg>
  )
}

export function IconoAprendizaje() {
  return (
    <svg {...BASE}>
      <path d="M20 12a8 8 0 1 1-2.35-5.65" />
      <path d="M20 4.5v4h-4" />
    </svg>
  )
}

export function IconoCategorias() {
  return (
    <svg {...BASE}>
      <path d="M4 6h10M4 12h16M4 18h7" />
    </svg>
  )
}

export function IconoPresupuesto() {
  return (
    <svg {...BASE}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5V12l6 6" />
    </svg>
  )
}

/** Flecha diagonal dentro de un círculo de color, como los indicadores de la referencia. */
export function FlechaCirculo({ color, abajo = false }: { color: string; abajo?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill={color} />
      <path
        d={abajo ? 'M7 7l6 6M13 8.5V13H8.5' : 'M7 13l6-6M8.5 7H13v4.5'}
        fill="none"
        stroke="#0b0d10"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Marca de FinanzasAI: un trazo ascendente dentro de un anillo, en el azul de acento. */
export function Logo() {
  return (
    <svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="18.5" fill="none" stroke="var(--acento-claro)" strokeWidth="2" opacity="0.9" />
      <path
        d="M11 26l6-7 4.5 4.5L29 14"
        fill="none"
        stroke="var(--acento-claro)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
