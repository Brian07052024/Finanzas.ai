import { useRef, useState, type MouseEvent, type ReactNode } from 'react'

interface EstadoGlobo {
  x: number
  y: number
  contenido: ReactNode
}

/**
 * Globo de información al pasar el mouse sobre una marca de una gráfica.
 * El contenedor que recibe `ref` debe tener position: relative.
 */
export function useGlobo() {
  const ref = useRef<HTMLDivElement>(null)
  const [globo, setGlobo] = useState<EstadoGlobo | null>(null)

  function mostrar(evento: MouseEvent, contenido: ReactNode) {
    const caja = ref.current?.getBoundingClientRect()
    if (!caja) return
    const x = evento.clientX - caja.left
    // Si el globo se saldría por la derecha, se muestra a la izquierda del cursor.
    const izquierda = x > caja.width - 220 ? x - 214 : x + 14
    setGlobo({ x: izquierda, y: evento.clientY - caja.top + 14, contenido })
  }

  function ocultar() {
    setGlobo(null)
  }

  const elemento = globo && (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 w-max max-w-[200px] rounded-2xl border-[1.5px] border-white/20 bg-[#13171b]/95 px-3.5 py-2.5 text-xs leading-relaxed text-[var(--tinta-2)] shadow-xl shadow-black/40"
      style={{ left: globo.x, top: globo.y }}
    >
      {globo.contenido}
    </div>
  )

  return { ref, mostrar, ocultar, elemento }
}
