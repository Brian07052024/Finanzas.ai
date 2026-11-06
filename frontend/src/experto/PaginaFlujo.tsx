import { useEffect, useState } from 'react'
import { fecha, moneda } from '../formato'
import { RedFlujo } from '../graficas/RedFlujo'
import { mensajeDeError } from '../http'
import { etiquetaCategoria, etiquetaNodo } from '../movimientos/categorias'
import { Aviso } from '../ui/Aviso'
import { Chip } from '../ui/Chip'
import { Dato } from '../ui/Dato'
import { EsqueletoTarjeta, TextoCargando } from '../ui/Esqueleto'
import { IconoFlujo } from '../ui/iconos'
import { Tarjeta } from '../ui/Tarjeta'
import { obtenerFlujo, type Flujo } from './api'

const COLOR_SOBRE: Record<string, string> = {
  Necesidades: 'var(--serie-necesidades)',
  Deseos: 'var(--serie-deseos)',
  Ahorro: 'var(--serie-ahorro)',
}

export function PaginaFlujo() {
  const [datos, setDatos] = useState<Flujo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    obtenerFlujo().then(setDatos, (e) => setError(mensajeDeError(e).join(' ')))
  }, [])

  if (error) return <Aviso>{error}</Aviso>
  if (!datos)
    return (
      <div className="space-y-6">
        <TextoCargando />
        <EsqueletoTarjeta alto="h-[38rem]" lineas={6} />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <EsqueletoTarjeta alto="h-24" lineas={1} />
          <EsqueletoTarjeta alto="h-24" lineas={1} />
          <EsqueletoTarjeta alto="h-24" lineas={1} />
          <EsqueletoTarjeta alto="h-24" lineas={1} />
        </div>
      </div>
    )

  const teoremaSeCumple = datos.flujoMaximo === datos.capacidadCorte

  return (
    <div className="space-y-6">
      <Tarjeta
        variante="vidrio"
        titulo="Flujo del ingreso"
        icono={<IconoFlujo />}
        accion={
          <Chip tono="neutro">
            {fecha(datos.inicio)} – {fecha(datos.fin)}
          </Chip>
        }
      >
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--tinta-3)]">
          El ingreso fluye a los sobres Necesidades (tope 50%), Deseos (30%) y Ahorro (20%) según la regla 50/30/20 (R1),
          y de ahí a cada categoría hasta lo que gastaste. El flujo máximo, calculado con Edmonds-Karp, es cuánto de tus
          gastos y de tu meta de ahorro cabe en ese presupuesto.
        </p>
        {datos.ingresos === 0 ? (
          <Aviso tono="alerta">No hay ingresos registrados en esta quincena, así que no hay flujo que repartir.</Aviso>
        ) : (
          <RedFlujo aristas={datos.aristas} ingresos={datos.ingresos} />
        )}
      </Tarjeta>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Dato titulo="Ingresos" valor={moneda(datos.ingresos)} />
        <Dato titulo="Gastos + meta de ahorro" valor={moneda(datos.demandaTotal)} />
        <Dato titulo="Flujo máximo" valor={moneda(datos.flujoMaximo)} tono="text-[var(--texto-ingreso)]" />
        <Dato titulo="Capacidad del corte mínimo" valor={moneda(datos.capacidadCorte)} tono="text-[var(--texto-ingreso)]" />
      </dl>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Tarjeta
          titulo="Corte mínimo"
          accion={
            <Chip tono={teoremaSeCumple ? 'turquesa' : 'rojo'}>
              {teoremaSeCumple ? 'Flujo máximo = corte mínimo' : 'No coinciden'}
            </Chip>
          }
        >
          <p className="text-sm text-[var(--tinta-3)]">
            No caben en el presupuesto <span className="text-white">{moneda(datos.demandaSinCubrir)}</span>. Ingreso sin
            asignar: <span className="text-white">{moneda(datos.ingresoSinAsignar)}</span>.
          </p>
          <ul className="space-y-3">
            {datos.corte.map((a) => (
              <li key={`${a.desde}-${a.hacia}`} className="rounded-[1.1rem] border-[1.5px] border-amber-300/35 px-4 py-3">
                <p className="flex flex-wrap items-center justify-between gap-2 text-[var(--tinta-1)]">
                  {etiquetaNodo(a.desde)} → {etiquetaNodo(a.hacia)}
                  <span className="text-sm text-amber-200 tabular-nums">{moneda(a.capacidad)}</span>
                </p>
                <p className="mt-1 text-sm text-[var(--tinta-3)]">{a.interpretacion}</p>
              </li>
            ))}
          </ul>
        </Tarjeta>

        <Tarjeta titulo="Sobres 50/30/20">
          <div className="space-y-5">
            {datos.sobres.map((s) => {
              // Un sobre de gasto lleno es una advertencia; el de ahorro lleno significa meta cubierta.
              const lleno = s.tope > 0 && s.asignado >= s.tope
              const advertencia = lleno && s.nombre !== 'Ahorro'
              return (
                <div key={s.nombre} className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 text-[var(--tinta-1)]">
                      <span className="h-2 w-2 rounded-full" style={{ background: COLOR_SOBRE[s.nombre] }} aria-hidden="true" />
                      {s.nombre}
                      {advertencia && <Chip tono="ambar">lleno</Chip>}
                    </span>
                    <span className="text-[var(--tinta-3)] tabular-nums">
                      {moneda(s.asignado)} de {moneda(s.tope)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.06]">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${s.tope > 0 ? Math.min(100, (s.asignado / s.tope) * 100) : 0}%`,
                        background: COLOR_SOBRE[s.nombre],
                      }}
                    />
                  </div>
                  <p className="text-xs text-[var(--tinta-3)]">Demanda: {moneda(s.demanda)}</p>
                </div>
              )
            })}
          </div>
        </Tarjeta>
      </div>

      <Tarjeta titulo="Categorías">
        <div className="-mx-2 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[var(--tinta-3)]">
              <tr>
                <th className="px-2 pb-3 font-normal">Categoría</th>
                <th className="px-2 pb-3 font-normal">Sobre</th>
                <th className="px-2 pb-3 text-right font-normal">Gasto</th>
                <th className="px-2 pb-3 text-right font-normal">Cubierto</th>
                <th className="px-2 pb-3 text-right font-normal">Sin cubrir</th>
              </tr>
            </thead>
            <tbody>
              {datos.categorias.map((c) => (
                <tr key={c.categoria} className="border-t border-white/[0.08]">
                  <td className="px-2 py-3 text-white">{etiquetaCategoria(c.categoria)}</td>
                  <td className="px-2 py-3">
                    <Chip tono={c.esNecesidad ? 'azul' : 'naranja'}>{c.esNecesidad ? 'Necesidades' : 'Deseos'}</Chip>
                  </td>
                  <td className="px-2 py-3 text-right tabular-nums">{moneda(c.gasto)}</td>
                  <td className="px-2 py-3 text-right tabular-nums">{moneda(c.asignado)}</td>
                  <td
                    className={`px-2 py-3 text-right tabular-nums ${c.sinCubrir > 0 ? 'text-[var(--texto-gasto)]' : 'text-[var(--tinta-3)]'}`}
                  >
                    {moneda(c.sinCubrir)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[var(--tinta-3)]">
          El valor del flujo máximo es único, pero cuando un sobre se llena el reparto entre sus categorías depende del
          orden en que el algoritmo encontró los caminos.
        </p>
      </Tarjeta>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Tarjeta titulo="Caminos aumentantes (Edmonds-Karp)">
          {datos.caminos.length === 0 ? (
            <p className="text-sm text-[var(--tinta-3)]">No hay caminos: el flujo es cero.</p>
          ) : (
            <ol className="space-y-2.5 text-sm">
              {datos.caminos.map((c) => (
                <li key={c.numero} className="grid grid-cols-[1.5rem_1fr_auto] gap-2">
                  <span className="text-[var(--tinta-3)]">{c.numero}</span>
                  <span className="text-[var(--tinta-2)]">{c.nodos.map(etiquetaNodo).join(' → ')}</span>
                  <span className="text-[var(--texto-ahorro)] tabular-nums">+{moneda(c.cuello)}</span>
                </li>
              ))}
            </ol>
          )}
        </Tarjeta>

        <Tarjeta titulo="Aristas de la red">
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[var(--tinta-3)]">
                <tr>
                  <th className="px-2 pb-3 font-normal">Arista</th>
                  <th className="px-2 pb-3 text-right font-normal">Flujo / capacidad</th>
                </tr>
              </thead>
              <tbody>
                {datos.aristas.map((a) => (
                  <tr key={`${a.desde}-${a.hacia}`} className="border-t border-white/[0.08]">
                    <td className="px-2 py-2.5 text-[var(--tinta-2)]">
                      <span className="inline-flex items-center gap-2">
                        {etiquetaNodo(a.desde)} → {etiquetaNodo(a.hacia)}
                        {a.enCorte && <Chip tono="ambar">corte</Chip>}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-right whitespace-nowrap text-[var(--tinta-1)] tabular-nums">
                      {moneda(a.flujo)} <span className="text-[var(--tinta-3)]">/ {moneda(a.capacidad)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tarjeta>
      </div>
    </div>
  )
}
