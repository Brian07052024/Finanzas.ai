import type { ResultadoBusqueda } from '../experto/api'
import { useGlobo } from './useGlobo'

interface Props {
  exhaustiva: ResultadoBusqueda
  heuristica: ResultadoBusqueda
}

/**
 * Estados explorados y generados por cada búsqueda. Es una sola medida por gráfica,
 * así que lleva un solo color y el nombre del algoritmo como etiqueta de cada barra.
 */
export function ComparacionBusquedas({ exhaustiva, heuristica }: Props) {
  const metricas = [
    {
      titulo: 'Estados explorados',
      valores: [
        { nombre: exhaustiva.algoritmo, valor: exhaustiva.estadosExplorados },
        { nombre: heuristica.algoritmo, valor: heuristica.estadosExplorados },
      ],
    },
    {
      titulo: 'Estados generados',
      valores: [
        { nombre: exhaustiva.algoritmo, valor: exhaustiva.estadosGenerados },
        { nombre: heuristica.algoritmo, valor: heuristica.estadosGenerados },
      ],
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {metricas.map((m) => (
        <Grupo key={m.titulo} titulo={m.titulo} valores={m.valores} />
      ))}
    </div>
  )
}

function Grupo({ titulo, valores }: { titulo: string; valores: { nombre: string; valor: number }[] }) {
  const { ref, mostrar, ocultar, elemento } = useGlobo()
  const maximo = Math.max(...valores.map((v) => v.valor), 1)

  return (
    <figure ref={ref} className="relative space-y-3">
      <figcaption className="text-sm text-[var(--tinta-3)]">{titulo}</figcaption>
      {valores.map((v) => (
        <div
          key={v.nombre}
          className="grid grid-cols-[8rem_1fr_3.5rem] items-center gap-3 text-sm"
          onMouseMove={(e) => mostrar(e, `${v.nombre}: ${v.valor} estados`)}
          onMouseLeave={ocultar}
        >
          <span className="text-[var(--tinta-2)]">{v.nombre}</span>
          <span className="h-2.5 rounded-full bg-white/[0.06]">
            <span
              className="block h-full min-w-2.5 rounded-full"
              style={{
                width: `${(v.valor / maximo) * 100}%`,
                background: 'linear-gradient(90deg, rgba(78,163,255,0.55), var(--acento-claro))',
              }}
            />
          </span>
          <span className="text-right text-lg text-white tabular-nums">{v.valor}</span>
        </div>
      ))}
      {elemento}
    </figure>
  )
}
