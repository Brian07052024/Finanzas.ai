import { moneda } from '../formato'
import { useGlobo } from './useGlobo'

interface Props {
  ingresos: number
  necesidades: number
  deseos: number
  ahorro: number
}

/**
 * Barra apilada del ingreso según la regla 50/30/20: necesidades, deseos y ahorro.
 * Las marcas en 50% y 80% son los topes acumulados de necesidades y de necesidades + deseos.
 * Si los gastos superan el ingreso, la escala crece para mostrar el exceso a la derecha del 100%.
 */
export function BarraPresupuesto({ ingresos, necesidades, deseos, ahorro }: Props) {
  const { ref, mostrar, ocultar, elemento } = useGlobo()

  if (ingresos <= 0) {
    return <p className="text-sm text-[var(--tinta-3)]">Registra un ingreso para ver la distribución 50/30/20.</p>
  }

  const gastos = necesidades + deseos
  const escala = Math.max(ingresos, gastos)
  const pct = (valor: number) => (valor / escala) * 100
  const pctIngreso = (valor: number) => Math.round((valor / ingresos) * 1000) / 10

  const segmentos = [
    { nombre: 'Necesidades', valor: necesidades, color: 'var(--serie-necesidades)', tope: 'tope 50%' },
    { nombre: 'Deseos', valor: deseos, color: 'var(--serie-deseos)', tope: 'tope 30%' },
    { nombre: 'Ahorro', valor: Math.max(0, ahorro), color: 'var(--serie-ahorro)', tope: 'meta 20%' },
  ].filter((s) => s.valor > 0)

  const marcas = [
    { etiqueta: '50%', posicion: pct(ingresos * 0.5) },
    { etiqueta: '80%', posicion: pct(ingresos * 0.8) },
  ]

  return (
    <figure className="space-y-4">
      <div ref={ref} className="relative pt-6">
        {marcas.map((m) => (
          <div
            key={m.etiqueta}
            className="absolute top-0 bottom-0 flex flex-col items-center"
            style={{ left: `${m.posicion}%`, transform: 'translateX(-50%)' }}
            aria-hidden="true"
          >
            <span className="text-[11px] text-[var(--tinta-3)]">{m.etiqueta}</span>
            <span className="mt-1 w-px flex-1 border-l border-dashed border-white/40" />
          </div>
        ))}
        <div
          className="flex h-3 gap-0.5"
          role="img"
          aria-label={`Necesidades ${pctIngreso(necesidades)}%, deseos ${pctIngreso(deseos)}%, ahorro ${pctIngreso(ahorro)}% del ingreso`}
        >
          {segmentos.map((s) => (
            <div
              key={s.nombre}
              className="h-full rounded-full"
              style={{ width: `${pct(s.valor)}%`, background: s.color }}
              onMouseMove={(e) =>
                mostrar(
                  e,
                  <>
                    <p className="text-[var(--tinta-1)]">{s.nombre}</p>
                    <p>
                      {moneda(s.valor)} · {pctIngreso(s.valor)}% del ingreso
                    </p>
                    <p>{s.tope}</p>
                  </>,
                )
              }
              onMouseLeave={ocultar}
            />
          ))}
        </div>
        {elemento}
      </div>
      <figcaption className="grid grid-cols-3 gap-3 text-sm">
        <ValorLeyenda color="var(--serie-necesidades)" nombre="Necesidades" valor={`${pctIngreso(necesidades)}%`} tope="de 50%" />
        <ValorLeyenda color="var(--serie-deseos)" nombre="Deseos" valor={`${pctIngreso(deseos)}%`} tope="de 30%" />
        <ValorLeyenda color="var(--serie-ahorro)" nombre="Ahorro" valor={`${pctIngreso(ahorro)}%`} tope="meta 20%" />
      </figcaption>
      {gastos > ingresos && (
        <p className="text-sm text-[var(--texto-alerta)]">Gastas {moneda(gastos - ingresos)} más de lo que ingresas.</p>
      )}
    </figure>
  )
}

function ValorLeyenda({ color, nombre, valor, tope }: { color: string; nombre: string; valor: string; tope: string }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-[var(--tinta-3)]">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />
        {nombre}
      </p>
      <p className="mt-0.5 text-lg text-white tabular-nums">
        {valor} <span className="text-xs text-[var(--tinta-3)]">{tope}</span>
      </p>
    </div>
  )
}

export function Leyenda({ color, texto }: { color: string; texto: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />
      {texto}
    </span>
  )
}
