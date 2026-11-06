import { useLayoutEffect, useRef, type ReactNode } from 'react'

const PASO_MS = 55
const MAXIMO_PASOS = 8

/**
 * Hace que las tarjetas (.entrada) entren una tras otra en el orden en que aparecen en la página.
 *
 * Las tarjetas se montan cuando llegan los datos de la API, no al abrir la sección, así que un efecto
 * de React no se enteraría. Por eso se usa un MutationObserver: cada vez que aparecen tarjetas nuevas,
 * les asigna un retraso creciente. El callback corre como microtarea, antes de pintar el cuadro, así que
 * el retraso ya está puesto cuando la animación arranca. Cada tarjeta se marca para no volver a animarla
 * cuando la página se actualiza (por ejemplo, al rechazar un recorte).
 */
export function Escalonado({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const raiz = ref.current
    if (!raiz) return

    const asignar = () => {
      const nuevas = raiz.querySelectorAll<HTMLElement>('.entrada:not([data-escalonado])')
      nuevas.forEach((tarjeta, i) => {
        tarjeta.style.animationDelay = `${Math.min(i, MAXIMO_PASOS) * PASO_MS}ms`
        tarjeta.dataset.escalonado = ''
      })
    }

    asignar()
    const observador = new MutationObserver(asignar)
    observador.observe(raiz, { childList: true, subtree: true })
    return () => observador.disconnect()
  }, [])

  return <div ref={ref}>{children}</div>
}
