import type { ButtonHTMLAttributes } from 'react'

type Variante = 'primario' | 'secundario' | 'peligro'

const CLASES: Record<Variante, string> = {
  primario: 'bg-[var(--acento)] text-white hover:bg-[#1683ec]',
  secundario: 'border-[1.5px] border-white/20 text-[var(--tinta-1)] hover:border-white/35 hover:bg-white/5',
  peligro: 'border-[1.5px] border-red-400/45 text-red-300 hover:bg-red-400/10',
}

const TAMANOS = {
  normal: 'px-5 py-2.5 text-sm',
  chico: 'px-3 py-1 text-xs',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamano?: keyof typeof TAMANOS
}

export function Boton({ variante = 'primario', tamano = 'normal', className = '', type = 'button', ...resto }: Props) {
  return (
    <button
      type={type}
      className={`rounded-full font-normal transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--acento-claro)] disabled:cursor-not-allowed disabled:opacity-50 ${CLASES[variante]} ${TAMANOS[tamano]} ${className}`}
      {...resto}
    />
  )
}
