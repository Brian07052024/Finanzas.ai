import type { ReactNode } from 'react'

interface Props {
  titulo: ReactNode
  valor: ReactNode
  detalle?: ReactNode
  /** Clase de color para el valor (por ejemplo, text-red-300 para un saldo negativo). */
  tono?: string
  /** Sin borde, para usarlo dentro de una tarjeta que ya tiene uno. */
  plano?: boolean
}

/** Indicador: un número protagonista con su título y, opcionalmente, un detalle. */
export function Dato({ titulo, valor, detalle, tono = 'text-white', plano = false }: Props) {
  return (
    <div className={plano ? '' : 'placa entrada rounded-[1.25rem] px-5 py-4'}>
      <dt className="text-sm text-[var(--tinta-3)]">{titulo}</dt>
      <dd className={`mt-1.5 text-2xl font-normal tracking-tight tabular-nums ${tono}`}>{valor}</dd>
      {detalle && <dd className="mt-1 text-sm text-[var(--tinta-3)]">{detalle}</dd>}
    </div>
  )
}
