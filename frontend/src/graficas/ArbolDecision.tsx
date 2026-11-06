import type { NodoArbol, Regla } from '../experto/api'

interface Props {
  nodos: NodoArbol[]
  reglas: Regla[]
}

interface NodoUbicado extends NodoArbol {
  padre: NodoUbicado | null
  hijos: NodoUbicado[]
  x: number
  y: number
}

const ANCHO_NODO = 176
const ALTO_NODO = 60
const SEPARACION_COLUMNA = 200
const SEPARACION_FILA = 72
const MARGEN = 12
const COLOR_CAMINO = '#4ea3ff'
const COLOR_CAMINO_TEXTO = '#7cbcff'

/**
 * Dibuja el árbol de decisión de izquierda a derecha a partir del recorrido en preorden de la API.
 *
 * Reconstrucción: en preorden, el padre de un nodo es el nodo anterior más cercano con profundidad d - 1.
 * Ubicación: la profundidad da la columna; las hojas se reparten en filas en el orden del recorrido
 * (la rama Sí queda arriba de la rama No) y cada pregunta se centra entre sus hijos.
 */
export function ArbolDecision({ nodos, reglas }: Props) {
  const ubicados = ubicar(nodos)
  const profundidadMaxima = Math.max(...ubicados.map((n) => n.profundidad))
  const hojas = ubicados.filter((n) => n.hijos.length === 0).length
  const ancho = MARGEN * 2 + profundidadMaxima * SEPARACION_COLUMNA + ANCHO_NODO
  const alto = MARGEN * 2 + (hojas - 1) * SEPARACION_FILA + ALTO_NODO
  const enunciado = (codigo: string | null) => reglas.find((r) => r.codigo === codigo)?.enunciado

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        className="h-auto w-full min-w-[860px]"
        role="img"
        aria-label="Árbol de decisión con el camino recorrido resaltado"
      >
        {ubicados
          .filter((n) => n.padre)
          .map((n) => {
            const padre = n.padre!
            const x1 = padre.x + ANCHO_NODO
            const y1 = padre.y + ALTO_NODO / 2
            const x2 = n.x
            const y2 = n.y + ALTO_NODO / 2
            const medio = (x1 + x2) / 2
            const resaltada = padre.enCamino && n.enCamino
            return (
              <g key={`${padre.id}-${n.id}`}>
                <path
                  d={`M ${x1} ${y1} C ${medio} ${y1}, ${medio} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={resaltada ? COLOR_CAMINO : 'rgba(255,255,255,0.14)'}
                  strokeWidth={resaltada ? 2.5 : 1.5}
                />
                <text
                  x={medio}
                  y={(y1 + y2) / 2 - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fill={resaltada ? COLOR_CAMINO_TEXTO : 'var(--tinta-3)'}
                >
                  {n.rama ? 'Sí' : 'No'}
                </text>
              </g>
            )
          })}

        {ubicados.map((n) => {
          const lineas = partir(n.texto, 25)
          const esFinal = n.esHoja && n.enCamino
          return (
            <g key={n.id} transform={`translate(${n.x} ${n.y})`} opacity={n.enCamino ? 1 : 0.45}>
              <title>
                {`[${n.id}] ${n.texto}` + (n.regla ? `
${n.regla}: ${enunciado(n.regla) ?? ''}` : '')}
              </title>
              <rect
                width={ANCHO_NODO}
                height={ALTO_NODO}
                rx={n.esHoja ? 30 : 16}
                fill={esFinal ? 'rgba(15,116,219,0.22)' : 'rgba(255,255,255,0.03)'}
                stroke={n.enCamino ? COLOR_CAMINO : 'rgba(255,255,255,0.22)'}
                strokeWidth={esFinal ? 2 : 1.5}
              />
              <text x={14} y={18} fontSize={10} fill={n.enCamino ? COLOR_CAMINO_TEXTO : 'var(--tinta-3)'}>
                {n.id}
                {n.esHoja ? ' · diagnóstico' : ''}
              </text>
              {n.regla && (
                <text x={ANCHO_NODO - 14} y={18} fontSize={10} textAnchor="end" fill="var(--tinta-3)">
                  {n.regla}
                </text>
              )}
              <text x={14} y={lineas.length > 1 ? 35 : 41} fontSize={11} fill="var(--tinta-1)">
                {lineas[0]}
                {lineas[1] && (
                  <tspan x={14} dy={14}>
                    {lineas[1]}
                  </tspan>
                )}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function ubicar(nodos: NodoArbol[]): NodoUbicado[] {
  const ubicados: NodoUbicado[] = []
  for (const nodo of nodos) {
    let padre: NodoUbicado | null = null
    for (let i = ubicados.length - 1; i >= 0; i--) {
      if (ubicados[i].profundidad === nodo.profundidad - 1) {
        padre = ubicados[i]
        break
      }
    }
    const ubicado: NodoUbicado = { ...nodo, padre, hijos: [], x: 0, y: 0 }
    padre?.hijos.push(ubicado)
    ubicados.push(ubicado)
  }

  let fila = 0
  const colocar = (nodo: NodoUbicado) => {
    nodo.x = MARGEN + nodo.profundidad * SEPARACION_COLUMNA
    if (nodo.hijos.length === 0) {
      nodo.y = MARGEN + fila * SEPARACION_FILA
      fila++
      return
    }
    nodo.hijos.forEach(colocar)
    nodo.y = (nodo.hijos[0].y + nodo.hijos[nodo.hijos.length - 1].y) / 2
  }
  const raiz = ubicados.find((n) => n.padre === null)
  if (raiz) colocar(raiz)

  return ubicados
}

/** Parte un texto en dos líneas por palabras; si no cabe, recorta la segunda con puntos suspensivos. */
function partir(texto: string, maximo: number): string[] {
  if (texto.length <= maximo) return [texto]
  const palabras = texto.split(' ')
  let primera = ''
  let i = 0
  while (i < palabras.length && (primera + ' ' + palabras[i]).trim().length <= maximo) {
    primera = (primera + ' ' + palabras[i]).trim()
    i++
  }
  let segunda = palabras.slice(i).join(' ')
  if (segunda.length > maximo) segunda = segunda.slice(0, maximo - 1) + '…'
  return [primera, segunda]
}
