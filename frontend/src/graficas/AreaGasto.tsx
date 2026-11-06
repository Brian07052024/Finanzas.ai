import { useState } from 'react'
import { moneda } from '../formato'
import type { Movimiento } from '../movimientos/api'
import { CATEGORIAS } from '../movimientos/categorias'
import { Dato } from '../ui/Dato'
import { Leyenda } from './BarraPresupuesto'
import { curvaMonotona } from './curvas'
import { useGlobo } from './useGlobo'

interface Props {
  inicio: string
  fin: string
  movimientos: Movimiento[]
  ingresos: number
}

const ANCHO = 640
const ALTO = 280
const M = { arriba: 18, derecha: 14, abajo: 30, izquierda: 52 }
const formatoDia = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' })
const formatoCompacto = new Intl.NumberFormat('es-MX', { notation: 'compact', maximumFractionDigits: 1 })

/**
 * Gasto acumulado de la quincena, día por día, con necesidades abajo y deseos apilados encima.
 * La línea punteada es el gasto máximo que todavía deja ahorrar el 20% del ingreso (R1).
 */
export function AreaGasto({ inicio, fin, movimientos, ingresos }: Props) {
  const { ref, mostrar, ocultar, elemento } = useGlobo()
  const [activo, setActivo] = useState<number | null>(null)
  const [hoy] = useState(() => claveDeFecha(new Date()))

  const dias = rangoDeDias(inicio, fin)
  // La curva llega hasta hoy; los días que faltan de la quincena quedan vacíos a la derecha.
  const indiceHoy = dias.indexOf(hoy)
  const ultimo = indiceHoy === -1 ? dias.length - 1 : indiceHoy

  const esNecesidad = new Map(CATEGORIAS.map((c) => [c.valor, c.esNecesidad]))
  const acumulado = dias.map(() => ({ necesidades: 0, deseos: 0 }))
  for (const m of movimientos) {
    if (m.tipo !== 'Gasto' || !m.categoria) continue
    const indice = dias.indexOf(m.fecha)
    if (indice === -1) continue
    if (esNecesidad.get(m.categoria)) acumulado[indice].necesidades += m.monto
    else acumulado[indice].deseos += m.monto
  }
  for (let i = 1; i < acumulado.length; i++) {
    acumulado[i].necesidades += acumulado[i - 1].necesidades
    acumulado[i].deseos += acumulado[i - 1].deseos
  }

  const visibles = acumulado.slice(0, ultimo + 1)
  const totalGastos = visibles.length > 0 ? visibles[visibles.length - 1].necesidades + visibles[visibles.length - 1].deseos : 0
  const maximo = escalaRedonda(Math.max(ingresos, totalGastos, 1) * 1.08)
  const anchoPlano = ANCHO - M.izquierda - M.derecha
  const altoPlano = ALTO - M.arriba - M.abajo
  const x = (i: number) => M.izquierda + (dias.length > 1 ? (i / (dias.length - 1)) * anchoPlano : 0)
  const y = (valor: number) => M.arriba + altoPlano - (valor / maximo) * altoPlano
  const base = y(0)

  const lineaNecesidades = visibles.map((d, i) => [x(i), y(d.necesidades)] as [number, number])
  const lineaTotal = visibles.map((d, i) => [x(i), y(d.necesidades + d.deseos)] as [number, number])
  const xFinal = x(visibles.length - 1)

  const areaNecesidades = `${curvaMonotona(lineaNecesidades)} L ${xFinal} ${base} L ${x(0)} ${base} Z`
  const areaDeseos = `${curvaMonotona(lineaTotal)} L ${xFinal} ${lineaNecesidades[lineaNecesidades.length - 1][1]} ${curvaMonotona(
    [...lineaNecesidades].reverse(),
  ).replace(/^M [^C]*/, '')} Z`

  const marcasY = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maximo)
  const cadaCuantos = Math.ceil(dias.length / 6)
  const limite = ingresos * 0.8

  return (
    <figure className="space-y-3">
      <div ref={ref} className="relative">
        <svg
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          className="h-auto w-full"
          role="img"
          aria-label={`Gasto acumulado de la quincena: ${moneda(totalGastos)} hasta hoy`}
          onMouseLeave={() => {
            setActivo(null)
            ocultar()
          }}
        >
          <defs>
            <linearGradient id="relleno-necesidades" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--serie-necesidades)" stopOpacity="0.4" />
              <stop offset="1" stopColor="var(--serie-necesidades)" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="relleno-deseos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--serie-deseos)" stopOpacity="0.38" />
              <stop offset="1" stopColor="var(--serie-deseos)" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {marcasY.map((v) => (
            <g key={v}>
              <line x1={M.izquierda} x2={ANCHO - M.derecha} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.06)" />
              <text x={M.izquierda - 10} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--tinta-3)">
                {v === 0 ? '0' : `$${formatoCompacto.format(v)}`}
              </text>
            </g>
          ))}

          {dias.map((d, i) =>
            i % cadaCuantos === 0 || i === dias.length - 1 ? (
              <text key={d} x={x(i)} y={ALTO - 8} textAnchor="middle" fontSize="11" fill="var(--tinta-3)">
                {formatoDia.format(fechaLocal(d)).replace('.', '')}
              </text>
            ) : null,
          )}

          {ingresos > 0 && (
            <g>
              <line
                x1={M.izquierda}
                x2={ANCHO - M.derecha}
                y1={y(limite)}
                y2={y(limite)}
                stroke="rgba(255,255,255,0.4)"
                strokeDasharray="5 5"
              />
              <text x={ANCHO - M.derecha} y={y(limite) - 7} textAnchor="end" fontSize="11" fill="var(--tinta-2)">
                Límite para ahorrar 20%: {moneda(limite)}
              </text>
            </g>
          )}

          {visibles.length > 1 && (
            <>
              <path d={areaNecesidades} fill="url(#relleno-necesidades)" />
              <path d={areaDeseos} fill="url(#relleno-deseos)" />
              <path d={curvaMonotona(lineaNecesidades)} fill="none" stroke="var(--serie-necesidades)" strokeWidth="2" />
              <path d={curvaMonotona(lineaTotal)} fill="none" stroke="var(--serie-deseos)" strokeWidth="2" />
            </>
          )}

          {activo !== null && (
            <g pointerEvents="none">
              <line x1={x(activo)} x2={x(activo)} y1={M.arriba} y2={base} stroke="rgba(255,255,255,0.25)" />
              <circle cx={x(activo)} cy={lineaNecesidades[activo][1]} r="4.5" fill="var(--serie-necesidades)" stroke="#13171b" strokeWidth="2" />
              <circle cx={x(activo)} cy={lineaTotal[activo][1]} r="4.5" fill="var(--serie-deseos)" stroke="#13171b" strokeWidth="2" />
            </g>
          )}

          {visibles.map((d, i) => {
            const paso = dias.length > 1 ? anchoPlano / (dias.length - 1) : anchoPlano
            return (
              <rect
                key={dias[i]}
                x={x(i) - paso / 2}
                y={M.arriba}
                width={paso}
                height={altoPlano}
                fill="transparent"
                onMouseMove={(e) => {
                  setActivo(i)
                  mostrar(
                    e,
                    <>
                      <p className="text-[var(--tinta-1)]">{formatoDia.format(fechaLocal(dias[i]))}</p>
                      <p>Necesidades: {moneda(d.necesidades)}</p>
                      <p>Deseos: {moneda(d.deseos)}</p>
                      <p className="text-[var(--tinta-1)]">Total: {moneda(d.necesidades + d.deseos)}</p>
                    </>,
                  )
                }}
              />
            )
          })}
        </svg>
        {elemento}
      </div>
      <figcaption className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-[var(--tinta-2)]">
        <Leyenda color="var(--serie-necesidades)" texto="Necesidades" />
        <Leyenda color="var(--serie-deseos)" texto="Deseos (apilados)" />
        <span className="inline-flex items-center gap-2">
          <svg width="22" height="6" aria-hidden="true">
            <line x1="0" y1="3" x2="22" y2="3" stroke="rgba(255,255,255,0.5)" strokeDasharray="4 3" />
          </svg>
          Límite para ahorrar 20%
        </span>
      </figcaption>
      <dl className="grid grid-cols-3 gap-4 border-t border-white/[0.08] pt-4">
        <Dato plano titulo="Gastado hasta hoy" valor={moneda(totalGastos)} />
        <Dato plano titulo="Promedio por día" valor={moneda(totalGastos / visibles.length)} />
        {ingresos > 0 ? (
          <Dato
            plano
            titulo={limite >= totalGastos ? 'Margen antes del límite' : 'Por encima del límite'}
            valor={moneda(Math.abs(limite - totalGastos))}
            tono={limite >= totalGastos ? 'text-[var(--texto-ahorro)]' : 'text-[var(--texto-gasto)]'}
          />
        ) : (
          <Dato plano titulo="Margen antes del límite" valor="Sin ingreso" tono="text-[var(--tinta-3)]" />
        )}
      </dl>
    </figure>
  )
}

function fechaLocal(clave: string): Date {
  const [anio, mes, dia] = clave.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

function claveDeFecha(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

function rangoDeDias(inicio: string, fin: string): string[] {
  const dias: string[] = []
  const actual = fechaLocal(inicio)
  const ultimo = fechaLocal(fin)
  while (actual <= ultimo) {
    dias.push(claveDeFecha(actual))
    actual.setDate(actual.getDate() + 1)
  }
  return dias
}

/** Redondea hacia arriba a 1, 2, 2.5 o 5 por una potencia de 10, para marcas de eje legibles. */
function escalaRedonda(valor: number): number {
  const potencia = Math.pow(10, Math.floor(Math.log10(valor)))
  for (const paso of [1, 2, 2.5, 5, 10]) {
    if (paso * potencia >= valor) return paso * potencia
  }
  return 10 * potencia
}
