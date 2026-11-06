import type { Flujo } from '../experto/api'
import { moneda } from '../formato'
import { etiquetaNodo } from '../movimientos/categorias'
import { Leyenda } from './BarraPresupuesto'

interface Props {
  aristas: Flujo['aristas']
  ingresos: number
}

interface Nodo {
  nombre: string
  x: number
  y: number
}

const ANCHO_NODO = 118
const ALTO_NODO = 30
const FILA = 42
const ANCHO = 1000
const COLUMNAS = [12, 200, 400, 640, ANCHO - ANCHO_NODO - 12]
const COLOR_CORTE = 'var(--estado-alerta)'

const SOBRES = ['Necesidades', 'Deseos', 'Ahorro']

/**
 * Red de flujo de la distribución del ingreso en cinco columnas:
 * Fuente, Ingreso, sobres 50/30/20, categorías y Destino.
 * Debajo de cada arista va una línea tenue con su capacidad; encima, el flujo con grosor proporcional.
 * Las aristas del corte mínimo se marcan en ámbar, punteadas y con etiqueta.
 */
export function RedFlujo({ aristas, ingresos }: Props) {
  const categoriasDe = (sobre: string) => aristas.filter((a) => a.desde === sobre).map((a) => a.hacia)
  const categorias = [...categoriasDe('Necesidades'), ...categoriasDe('Deseos')]
  const filas = Math.max(categorias.length + 1, 4)
  const alto = filas * FILA + 24

  const nodos = new Map<string, Nodo>()
  const poner = (nombre: string, columna: number, y: number) =>
    nodos.set(nombre, { nombre, x: COLUMNAS[columna], y })

  categorias.forEach((c, i) => poner(c, 3, 12 + i * FILA))
  const centroDe = (lista: string[], porDefecto: number) =>
    lista.length === 0 ? porDefecto : lista.reduce((s, c) => s + nodos.get(c)!.y, 0) / lista.length
  poner('Necesidades', 2, centroDe(categoriasDe('Necesidades'), 12))
  poner('Deseos', 2, centroDe(categoriasDe('Deseos'), 12 + 2 * FILA))
  poner('Ahorro', 2, 12 + categorias.length * FILA)
  const centro = (alto - ALTO_NODO) / 2
  poner('Fuente', 0, centro)
  poner('Ingreso', 1, centro)
  poner('Destino', 4, centro)

  // Grosor proporcional al valor respecto al ingreso (la arista más grande posible).
  const grosor = (valor: number) => (ingresos > 0 ? 1.5 + (valor / ingresos) * 22 : 1.5)

  const colorDe = (desde: string, hacia: string) => {
    const sobre = SOBRES.includes(desde) ? desde : SOBRES.includes(hacia) ? hacia : null
    if (sobre === 'Necesidades') return 'var(--serie-necesidades)'
    if (sobre === 'Deseos') return 'var(--serie-deseos)'
    if (sobre === 'Ahorro') return 'var(--serie-ahorro)'
    const origen = aristas.find((a) => a.hacia === desde && SOBRES.includes(a.desde))
    if (origen?.desde === 'Necesidades') return 'var(--serie-necesidades)'
    if (origen?.desde === 'Deseos') return 'var(--serie-deseos)'
    // Fuente -> Ingreso: todavía no pertenece a ningún sobre, va en un degradado neutro.
    return 'url(#flujo-total)'
  }

  return (
    <figure className="space-y-3">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${ANCHO} ${alto}`}
          className="h-auto w-full min-w-[760px]"
          role="img"
          aria-label="Red de flujo del ingreso con el corte mínimo marcado"
        >
          <defs>
            {/* En coordenadas absolutas: el trazo es horizontal y su caja tiene altura cero. */}
            <linearGradient
              id="flujo-total"
              gradientUnits="userSpaceOnUse"
              x1={COLUMNAS[0] + ANCHO_NODO}
              y1="0"
              x2={COLUMNAS[1]}
              y2="0"
            >
              <stop offset="0" stopColor="#f4f6f8" stopOpacity="0.08" />
              <stop offset="1" stopColor="#f4f6f8" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          {aristas.map((a) => {
            const origen = nodos.get(a.desde)
            const destino = nodos.get(a.hacia)
            if (!origen || !destino) return null
            const x1 = origen.x + ANCHO_NODO
            const y1 = origen.y + ALTO_NODO / 2
            const x2 = destino.x
            const y2 = destino.y + ALTO_NODO / 2
            // Ahorro salta la columna de categorías: va recto por debajo de ellas y solo al final
            // sube al Destino, para no cruzar por detrás de los nodos.
            const saltaColumna = origen.x === COLUMNAS[2] && destino.x === COLUMNAS[4]
            const xCurva = saltaColumna ? x2 - 110 : x1
            const medio = (xCurva + x2) / 2
            const d =
              `M ${x1} ${y1}` +
              (saltaColumna ? ` L ${xCurva} ${y1}` : '') +
              ` C ${medio} ${y1}, ${medio} ${y2}, ${x2} ${y2}`
            const xEtiqueta = saltaColumna ? (x1 + xCurva) / 2 : medio
            const yEtiqueta = saltaColumna ? y1 - 10 : (y1 + y2) / 2 - 8
            return (
              <g key={`${a.desde}-${a.hacia}`}>
                <title>
                  {`${etiquetaNodo(a.desde)} → ${etiquetaNodo(a.hacia)}\nFlujo ${moneda(a.flujo)} de capacidad ${moneda(a.capacidad)}` +
                    (a.enCorte ? '\nArista del corte mínimo (saturada)' : '')}
                </title>
                <path d={d} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={grosor(a.capacidad)} />
                {a.flujo > 0 && (
                  <path
                    d={d}
                    fill="none"
                    stroke={colorDe(a.desde, a.hacia)}
                    strokeOpacity={0.75}
                    strokeWidth={grosor(a.flujo)}
                  />
                )}
                {a.enCorte && (
                  <>
                    <path d={d} fill="none" stroke={COLOR_CORTE} strokeWidth={2.5} strokeDasharray="7 5" />
                    <text
                      x={xEtiqueta}
                      y={yEtiqueta}
                      textAnchor="middle"
                      fontSize={11}
                      fill={COLOR_CORTE}
                    >
                      corte
                    </text>
                  </>
                )}
              </g>
            )
          })}

          {[...nodos.values()].map((n) => {
            const borde =
              n.nombre === 'Necesidades'
                ? 'var(--serie-necesidades)'
                : n.nombre === 'Deseos'
                  ? 'var(--serie-deseos)'
                  : n.nombre === 'Ahorro'
                    ? 'var(--serie-ahorro)'
                    : 'rgba(255,255,255,0.24)'
            return (
              <g key={n.nombre} transform={`translate(${n.x} ${n.y})`}>
                <rect width={ANCHO_NODO} height={ALTO_NODO} rx={15} fill="#13171b" stroke={borde} strokeWidth={1.5} />
                <text x={ANCHO_NODO / 2} y={19.5} textAnchor="middle" fontSize={12} fill="var(--tinta-1)">
                  {etiquetaNodo(n.nombre)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--tinta-2)]">
        <Leyenda color="var(--serie-necesidades)" texto="Flujo a necesidades" />
        <Leyenda color="var(--serie-deseos)" texto="Flujo a deseos" />
        <Leyenda color="var(--serie-ahorro)" texto="Flujo a ahorro" />
        <span className="inline-flex items-center gap-2">
          <svg width="22" height="6" aria-hidden="true">
            <line x1="0" y1="3" x2="22" y2="3" stroke={COLOR_CORTE} strokeWidth="2.5" strokeDasharray="5 3" />
          </svg>
          Corte mínimo
        </span>
        <span className="text-[var(--tinta-3)]">Grosor = monto; línea tenue = capacidad.</span>
      </figcaption>
    </figure>
  )
}
