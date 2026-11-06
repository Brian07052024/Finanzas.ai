import { useEffect, useState } from 'react'
import type { Pestana } from '../App'
import { obtenerDiagnostico, type Diagnostico } from '../experto/api'
import { fecha, moneda } from '../formato'
import { AreaGasto } from '../graficas/AreaGasto'
import { BarraPresupuesto } from '../graficas/BarraPresupuesto'
import { BarrasCategoria } from '../graficas/BarrasCategoria'
import { mensajeDeError } from '../http'
import { obtenerQuincenaActual, type QuincenaActual } from '../movimientos/api'
import { Aviso } from '../ui/Aviso'
import { Boton } from '../ui/Boton'
import { Chip } from '../ui/Chip'
import { EsqueletoTarjeta, TextoCargando } from '../ui/Esqueleto'
import { FlechaCirculo, IconoCategorias, IconoPlan, IconoPresupuesto } from '../ui/iconos'
import { Tarjeta } from '../ui/Tarjeta'

interface Props {
  onIr: (pestana: Pestana) => void
}

/** Dashboard: resumen de la quincena con el diagnóstico del sistema experto y las gráficas principales. */
export function PaginaInicio({ onIr }: Props) {
  const [datos, setDatos] = useState<{ diagnostico: Diagnostico; quincena: QuincenaActual } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([obtenerDiagnostico(), obtenerQuincenaActual()]).then(
      ([diagnostico, quincena]) => setDatos({ diagnostico, quincena }),
      (e) => setError(mensajeDeError(e).join(' ')),
    )
  }, [])

  if (error) return <Aviso>{error}</Aviso>
  if (!datos)
    return (
      <div className="space-y-6">
        <TextoCargando />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_21rem]">
          <EsqueletoTarjeta alto="h-[34rem]" lineas={5} />
          <div className="grid grid-cols-1 gap-6">
            <EsqueletoTarjeta alto="h-52" lineas={2} />
            <EsqueletoTarjeta alto="h-72" lineas={4} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <EsqueletoTarjeta alto="h-96" lineas={5} />
          <EsqueletoTarjeta alto="h-96" lineas={6} />
        </div>
      </div>
    )

  const { hechos, diagnostico } = datos.diagnostico
  const { quincena } = datos
  const gastos = hechos.necesidades + hechos.deseos

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_21rem]">
        <Tarjeta
          variante="vidrio"
          titulo="Gasto de la quincena"
          icono={<IconoPlan />}
          accion={
            <Chip tono="azul">
              {fecha(quincena.inicio)} – {fecha(quincena.fin)}
            </Chip>
          }
        >
          <AreaGasto
            inicio={quincena.inicio}
            fin={quincena.fin}
            movimientos={quincena.movimientos}
            ingresos={hechos.ingresos}
          />
        </Tarjeta>

        <div className="grid grid-cols-1 gap-6">
          <Tarjeta
            variante="vidrio"
            titulo="Te queda"
            accion={
              hechos.ingresos > 0 && (
                <span className="inline-flex items-center gap-2 text-sm text-[var(--texto-ingreso)]">
                  {hechos.porcentajeAhorro}% del ingreso
                  <FlechaCirculo color="var(--texto-ingreso)" abajo={hechos.ahorro < 0} />
                </span>
              )
            }
          >
            <p
              className={`text-[2.6rem] leading-none font-medium tracking-tight tabular-nums ${hechos.ahorro < 0 ? 'text-[var(--texto-gasto)]' : 'text-[var(--texto-saldo)]'}`}
            >
              {moneda(hechos.ahorro)}
            </p>
            <div className="grid grid-cols-2 divide-x divide-white/15">
              <div className="pr-4">
                <p className="flex items-center gap-2 text-sm text-[var(--texto-ingreso)]">
                  Ingresos <FlechaCirculo color="var(--texto-ingreso)" />
                </p>
                <p className="mt-2 text-lg text-white tabular-nums">{moneda(hechos.ingresos)}</p>
              </div>
              <div className="pl-4">
                <p className="flex items-center gap-2 text-sm text-[var(--texto-gasto)]">
                  Gastos <FlechaCirculo color="var(--texto-gasto)" />
                </p>
                <p className="mt-2 text-lg text-white tabular-nums">{moneda(gastos)}</p>
              </div>
            </div>
          </Tarjeta>

          <Tarjeta
            titulo="Diagnóstico"
            accion={<Chip tono={diagnostico.recomiendaPlan ? 'ambar' : 'turquesa'}>{diagnostico.hojaId}</Chip>}
          >
            <div className="space-y-1.5">
              <p className="text-white">{diagnostico.titulo}</p>
              <p className="text-sm leading-relaxed text-[var(--tinta-3)]">{diagnostico.descripcion}</p>
            </div>
            <div className="space-y-2">
              {diagnostico.recomiendaPlan && (
                <Boton className="w-full" onClick={() => onIr('plan')}>
                  Ver plan de recortes
                </Boton>
              )}
              <Boton variante="secundario" className="w-full" onClick={() => onIr('diagnostico')}>
                Ver el razonamiento
              </Boton>
            </div>
          </Tarjeta>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Tarjeta titulo="Distribución 50/30/20" icono={<IconoPresupuesto />}>
          <BarraPresupuesto
            ingresos={hechos.ingresos}
            necesidades={hechos.necesidades}
            deseos={hechos.deseos}
            ahorro={hechos.ahorro}
          />
          {hechos.ingresos > 0 && (
            <table className="w-full text-sm">
              <thead className="text-[var(--tinta-3)]">
                <tr>
                  <th className="pb-2 text-left font-normal">Sobre</th>
                  <th className="pb-2 text-right font-normal">Monto</th>
                  <th className="pb-2 text-right font-normal">Tope</th>
                  <th className="pb-2 text-right font-normal">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                <FilaSobre nombre="Necesidades" monto={hechos.necesidades} tope={hechos.ingresos * 0.5} esAhorro={false} />
                <FilaSobre nombre="Deseos" monto={hechos.deseos} tope={hechos.ingresos * 0.3} esAhorro={false} />
                <FilaSobre nombre="Ahorro" monto={hechos.ahorro} tope={hechos.ingresos * 0.2} esAhorro />
              </tbody>
            </table>
          )}
          <p className="text-sm text-[var(--tinta-3)]">
            Regla 50/30/20 (R1): hasta 50% en necesidades, hasta 30% en deseos y al menos 20% de ahorro.
          </p>
        </Tarjeta>

        <Tarjeta titulo="Gasto por categoría" icono={<IconoCategorias />}>
          <BarrasCategoria gastos={hechos.gastosPorCategoria} ingresos={hechos.ingresos} />
        </Tarjeta>
      </div>
    </div>
  )
}

/** Un sobre contra su tope. En gastos, pasarse es malo; en ahorro, quedarse corto es lo malo. */
function FilaSobre({ nombre, monto, tope, esAhorro }: { nombre: string; monto: number; tope: number; esAhorro: boolean }) {
  const diferencia = esAhorro ? monto - tope : tope - monto
  const bien = diferencia >= 0
  const texto = esAhorro ? (bien ? 'Sobra' : 'Faltan') : bien ? 'Margen' : 'Excede'
  return (
    <tr className="border-t border-white/[0.08]">
      <td className="py-2.5 text-[var(--tinta-2)]">{nombre}</td>
      <td className="py-2.5 text-right text-white tabular-nums">{moneda(monto)}</td>
      <td className="py-2.5 text-right text-[var(--tinta-3)] tabular-nums">{moneda(tope)}</td>
      <td className={`py-2.5 text-right tabular-nums ${bien ? 'text-[var(--texto-ahorro)]' : 'text-[var(--texto-gasto)]'}`}>
        {texto} {moneda(Math.abs(diferencia))}
      </td>
    </tr>
  )
}
