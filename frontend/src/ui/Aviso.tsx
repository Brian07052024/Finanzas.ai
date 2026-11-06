import type { ReactNode } from 'react'

const TONOS = {
  error: 'border-red-400/45 text-red-300',
  alerta: 'border-amber-300/45 text-amber-200',
}

/** Mensaje con contorno de color. El de error se anuncia a los lectores de pantalla. */
export function Aviso({ tono = 'error', children }: { tono?: keyof typeof TONOS; children: ReactNode }) {
  return (
    <div role={tono === 'error' ? 'alert' : undefined} className={`rounded-2xl border px-4 py-3 text-sm ${TONOS[tono]}`}>
      {children}
    </div>
  )
}
