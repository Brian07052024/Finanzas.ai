import { moneda } from '../formato'
import type { Categoria } from '../movimientos/api'
import { etiquetaCategoria } from '../movimientos/categorias'
import { Leyenda } from './BarraPresupuesto'
import { useGlobo } from './useGlobo'

interface Props {
  gastos: { categoria: Categoria; esNecesidad: boolean; monto: number }[]
  ingresos: number
}

/** Gasto por categoría, de mayor a menor, coloreado según sea necesidad o deseo. */
export function BarrasCategoria({ gastos, ingresos }: Props) {
  const { ref, mostrar, ocultar, elemento } = useGlobo()

  if (gastos.length === 0) {
    return <p className="text-sm text-[var(--tinta-3)]">Aún no hay gastos en esta quincena.</p>
  }

  const ordenados = [...gastos].sort((a, b) => b.monto - a.monto)
  const maximo = ordenados[0].monto

  return (
    <figure className="space-y-4">
      <div ref={ref} className="relative space-y-3">
        {ordenados.map((g) => {
          const porcentaje = ingresos > 0 ? Math.round((g.monto / ingresos) * 1000) / 10 : null
          return (
            <div
              key={g.categoria}
              className="grid grid-cols-[7rem_1fr_5.5rem] items-center gap-3 text-sm"
              onMouseMove={(e) =>
                mostrar(
                  e,
                  <>
                    <p className="text-[var(--tinta-1)]">{etiquetaCategoria(g.categoria)}</p>
                    <p>{g.esNecesidad ? 'Necesidad' : 'Deseo'}</p>
                    <p>
                      {moneda(g.monto)}
                      {porcentaje !== null && ` · ${porcentaje}% del ingreso`}
                    </p>
                  </>,
                )
              }
              onMouseLeave={ocultar}
            >
              <span className="truncate text-[var(--tinta-2)]">{etiquetaCategoria(g.categoria)}</span>
              <span className="h-2 rounded-full bg-white/[0.06]">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${(g.monto / maximo) * 100}%`,
                    background: g.esNecesidad ? 'var(--serie-necesidades)' : 'var(--serie-deseos)',
                  }}
                />
              </span>
              <span className="text-right text-[var(--tinta-1)] tabular-nums">{moneda(g.monto)}</span>
            </div>
          )
        })}
        {elemento}
      </div>
      <figcaption className="flex flex-wrap gap-x-5 text-sm text-[var(--tinta-3)]">
        <Leyenda color="var(--serie-necesidades)" texto="Necesidad (no se recorta)" />
        <Leyenda color="var(--serie-deseos)" texto="Deseo (recortable)" />
      </figcaption>
    </figure>
  )
}
