import type { ReactNode } from 'react'

type Tono = 'azul' | 'naranja' | 'turquesa' | 'rojo' | 'ambar' | 'neutro'

const TONOS: Record<Tono, string> = {
  azul: 'border-[#4ea3ff]/60 text-[#7cbcff]',
  naranja: 'border-[#f0a24a]/60 text-[#f5b56b]',
  turquesa: 'border-[#2cc3a5]/60 text-[#4fd6bb]',
  rojo: 'border-red-400/60 text-red-300',
  ambar: 'border-amber-300/60 text-amber-200',
  neutro: 'border-white/25 text-[var(--tinta-2)]',
}

/** Etiqueta en cápsula con contorno de color, como los estados "Done" y "Pending" de la referencia. */
export function Chip({ tono = 'neutro', children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs whitespace-nowrap ${TONOS[tono]}`}>
      {children}
    </span>
  )
}
