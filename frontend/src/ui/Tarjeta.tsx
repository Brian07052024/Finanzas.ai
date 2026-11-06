import type { ReactNode } from 'react'

interface Props {
  /** vidrio: superficie protagonista con desenfoque (usar 1 o 2 por vista). placa: mismo aspecto, sin desenfoque. */
  variante?: 'vidrio' | 'placa'
  titulo?: ReactNode
  icono?: ReactNode
  accion?: ReactNode
  className?: string
  children: ReactNode
}

export function Tarjeta({ variante = 'placa', titulo, icono, accion, className = '', children }: Props) {
  return (
    // min-w-0: dentro de un grid, la tarjeta puede encogerse y sus tablas se desplazan por dentro.
    <section className={`${variante} entrada min-w-0 space-y-5 rounded-[1.6rem] p-5 sm:p-6 ${className}`}>
      {(titulo || accion) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {titulo && (
            <h2 className="flex items-center gap-2.5 text-[1.05rem] font-medium text-white">
              {icono && <span className="text-[var(--tinta-3)]">{icono}</span>}
              {titulo}
            </h2>
          )}
          {accion}
        </div>
      )}
      {children}
    </section>
  )
}
