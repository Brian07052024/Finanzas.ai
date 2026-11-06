import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { moneda, numero } from '../formato'
import { ComparacionBusquedas } from '../graficas/ComparacionBusquedas'
import { mensajeDeError } from '../http'
import type { Categoria } from '../movimientos/api'
import { etiquetaCategoria } from '../movimientos/categorias'
import { Aviso } from '../ui/Aviso'
import { Boton } from '../ui/Boton'
import { Chip } from '../ui/Chip'
import { Dato } from '../ui/Dato'
import { EsqueletoTarjeta, TextoCargando } from '../ui/Esqueleto'
import { IconoAprendizaje, IconoPlan } from '../ui/iconos'
import { Tarjeta } from '../ui/Tarjeta'
import {
  cambiarMeta,
  obtenerPesos,
  obtenerPlan,
  rechazarRecorte,
  reiniciarAprendizaje,
  type PesoSacrificio,
  type Plan,
  type ResultadoBusqueda,
} from './api'

export function PaginaPlan() {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [pesos, setPesos] = useState<PesoSacrificio[]>([])
  const [meta, setMeta] = useState('')
  const [errores, setErrores] = useState<string[]>([])
  const [ocupado, setOcupado] = useState(false)

  const cargar = useCallback(async () => {
    try {
      const [nuevoPlan, nuevosPesos] = await Promise.all([obtenerPlan(), obtenerPesos()])
      setPlan(nuevoPlan)
      setPesos(nuevosPesos)
      setMeta(String(nuevoPlan.porcentajeMeta))
      setErrores([])
    } catch (e) {
      setErrores(mensajeDeError(e))
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function ejecutar(accion: () => Promise<unknown>) {
    setOcupado(true)
    try {
      await accion()
      await cargar()
    } catch (e) {
      setErrores(mensajeDeError(e))
    } finally {
      setOcupado(false)
    }
  }

  function guardarMeta(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    void ejecutar(() => cambiarMeta(Number(meta)))
  }

  if (!plan) {
    return errores.length > 0 ? (
      <Errores mensajes={errores} />
    ) : (
      <div className="space-y-6">
        <TextoCargando />
        <EsqueletoTarjeta alto="h-60" lineas={3} />
        <EsqueletoTarjeta alto="h-80" lineas={5} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <EsqueletoTarjeta alto="h-64" lineas={4} />
          <EsqueletoTarjeta alto="h-64" lineas={4} />
        </div>
      </div>
    )
  }

  const [exhaustiva, heuristica] = plan.busquedas
  const mismoOptimo = exhaustiva.sacrificio !== null && exhaustiva.sacrificio === heuristica.sacrificio
  const ahorroEstados = Math.round((1 - heuristica.estadosExplorados / exhaustiva.estadosExplorados) * 100)

  return (
    <div className="space-y-6">
      <Tarjeta>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <form onSubmit={guardarMeta} className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="etiqueta">Meta de ahorro (% del ingreso)</span>
              <input
                type="number"
                min="1"
                max="100"
                step="1"
                required
                value={meta}
                onChange={(e) => setMeta(e.target.value)}
                className="campo w-28"
              />
            </label>
            <Boton type="submit" disabled={ocupado}>
              Guardar y buscar
            </Boton>
          </form>
          <p className="text-sm text-[var(--tinta-3)]">20% por defecto (regla 50/30/20, R1)</p>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-white/[0.08] pt-5 lg:grid-cols-4">
          <Dato plano titulo="Meta de ahorro" valor={moneda(plan.meta)} />
          <Dato plano titulo="Ahorro actual" valor={moneda(plan.ahorroActual)} />
          <Dato
            plano
            titulo="Falta recortar"
            valor={moneda(plan.faltante)}
            tono={plan.faltante > 0 ? 'text-[var(--texto-deseos)]' : 'text-[var(--texto-ahorro)]'}
          />
          <Dato plano titulo="Espacio de estados" valor={plan.totalEstados} detalle="4 niveles por cada deseo" />
        </dl>

        {!plan.alcanzable && (
          <Aviso>
            La meta no se alcanza ni con el recorte máximo (75% de cada deseo, R3). Con ese recorte el ahorro
            llegaría a {moneda(plan.ahorroMaximoPosible)}. Revisa tus necesidades o baja la meta.
          </Aviso>
        )}
        <Errores mensajes={errores} />
      </Tarjeta>

      <Tarjeta
        variante="vidrio"
        titulo="Búsqueda exhaustiva vs heurística"
        icono={<IconoPlan />}
        accion={mismoOptimo && <Chip tono="turquesa">Mismo óptimo · A* explora {ahorroEstados}% menos</Chip>}
      >
        <ComparacionBusquedas exhaustiva={exhaustiva} heuristica={heuristica} />
        <div className="-mx-2 overflow-x-auto border-t border-white/[0.08] pt-3">
          <table className="w-full text-left text-sm">
            <thead className="text-[var(--tinta-3)]">
              <tr>
                <th className="px-2 py-2 font-normal">Métrica</th>
                <th className="px-2 py-2 font-normal">{exhaustiva.algoritmo}</th>
                <th className="px-2 py-2 font-normal">{heuristica.algoritmo}</th>
              </tr>
            </thead>
            <tbody>
              <FilaComparacion
                metrica="Tiempo"
                a={`${exhaustiva.tiempoMs.toFixed(3)} ms`}
                b={`${heuristica.tiempoMs.toFixed(3)} ms`}
              />
              <FilaComparacion
                metrica="Sacrificio de la solución"
                a={exhaustiva.sacrificio === null ? 'Sin solución' : numero(exhaustiva.sacrificio)}
                b={heuristica.sacrificio === null ? 'Sin solución' : numero(heuristica.sacrificio)}
              />
            </tbody>
          </table>
        </div>
      </Tarjeta>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {plan.busquedas.map((busqueda) => (
          <ResultadoPlan
            key={busqueda.algoritmo}
            resultado={busqueda}
            ocupado={ocupado}
            onRechazar={(categoria) => void ejecutar(() => rechazarRecorte(categoria))}
          />
        ))}
      </div>

      <Tarjeta
        titulo="Aprendizaje"
        icono={<IconoAprendizaje />}
        accion={
          <Boton variante="secundario" tamano="chico" disabled={ocupado} onClick={() => void ejecutar(reiniciarAprendizaje)}>
            Reiniciar aprendizaje
          </Boton>
        }
      >
        <p className="text-sm text-[var(--tinta-3)]">
          Costo de sacrificio por categoría. Cada vez que rechazas el recorte de una categoría, su peso se duplica y el
          siguiente plan la evita si puede.
        </p>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {pesos.map((p) => (
            <li
              key={p.categoria}
              className={`rounded-[1.1rem] border-[1.5px] px-4 py-3 ${p.rechazos > 0 ? 'border-amber-300/50' : 'border-white/[0.12]'}`}
            >
              <p className="text-sm text-[var(--tinta-3)]">{etiquetaCategoria(p.categoria)}</p>
              <p className="mt-1 text-xl text-white tabular-nums">×{p.peso}</p>
              <p className="text-xs text-[var(--tinta-3)]">
                {p.rechazos === 0 ? 'sin rechazos' : p.rechazos === 1 ? '1 rechazo' : `${p.rechazos} rechazos`}
              </p>
            </li>
          ))}
        </ul>
      </Tarjeta>
    </div>
  )
}

function ResultadoPlan({
  resultado,
  ocupado,
  onRechazar,
}: {
  resultado: ResultadoBusqueda
  ocupado: boolean
  onRechazar: (categoria: Categoria) => void
}) {
  const { plan } = resultado
  const esAEstrella = resultado.traza.some((e) => e.heuristica !== null)

  return (
    <Tarjeta titulo={`Plan · ${resultado.algoritmo}`}>
      {!plan ? (
        <p className="text-[var(--tinta-3)]">No hay combinación de recortes que alcance la meta.</p>
      ) : plan.recortes.length === 0 ? (
        <p className="text-[var(--texto-ahorro)]">Ya alcanzas la meta; no hace falta recortar.</p>
      ) : (
        <>
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[var(--tinta-3)]">
                <tr>
                  <th className="px-2 pb-2 font-normal">Categoría</th>
                  <th className="px-2 pb-2 text-right font-normal">Recorte</th>
                  <th className="px-2 pb-2 text-right font-normal">Monto</th>
                  <th className="px-2 pb-2 text-right font-normal">Sacrificio</th>
                  <th className="px-2 pb-2" aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {plan.recortes.map((r) => (
                  <tr key={r.categoria} className="border-t border-white/[0.08]">
                    <td className="px-2 py-3 text-white">{etiquetaCategoria(r.categoria)}</td>
                    <td className="px-2 py-3 text-right whitespace-nowrap">
                      <Chip tono="naranja">{r.porcentaje}%</Chip>
                    </td>
                    <td className="px-2 py-3 text-right tabular-nums">{moneda(r.montoRecortado)}</td>
                    <td className="px-2 py-3 text-right text-[var(--tinta-3)] tabular-nums">{numero(r.sacrificio)}</td>
                    <td className="px-2 py-3 text-right">
                      <Boton variante="peligro" tamano="chico" disabled={ocupado} onClick={() => onRechazar(r.categoria)}>
                        Rechazar
                      </Boton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-[var(--tinta-3)]">
            Recortas <span className="text-white">{moneda(plan.totalRecortado)}</span> y tu ahorro queda en{' '}
            <span className="text-[var(--texto-ahorro)]">{moneda(plan.ahorroResultante)}</span> (meta{' '}
            {moneda(plan.meta)}).
          </p>
        </>
      )}

      <details className="group">
        <summary className="cursor-pointer text-sm text-[var(--tinta-3)] hover:text-white">
          Estados explorados ({resultado.estadosExplorados}
          {resultado.trazaTruncada ? `, se muestran los primeros ${resultado.traza.length}` : ''})
        </summary>
        <div className="mt-3 max-h-80 overflow-y-auto rounded-2xl border border-white/[0.08]">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#13171b] text-[var(--tinta-3)]">
              <tr>
                <th className="px-3 py-2 font-normal">#</th>
                <th className="px-3 py-2 font-normal">Estado</th>
                <th className="px-3 py-2 text-right font-normal">g (sacrificio)</th>
                {esAEstrella && <th className="px-3 py-2 text-right font-normal">h</th>}
                <th className="px-3 py-2 text-right font-normal">Meta</th>
              </tr>
            </thead>
            <tbody>
              {resultado.traza.map((e) => (
                <tr
                  key={e.orden}
                  className={e.cumpleMeta ? 'bg-[#1a9e86]/15 text-[var(--tinta-1)]' : 'text-[var(--tinta-2)]'}
                >
                  <td className="px-3 py-1.5 text-[var(--tinta-3)]">{e.orden}</td>
                  <td className="px-3 py-1.5">{e.descripcion}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{numero(e.costo)}</td>
                  {esAEstrella && (
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      {e.heuristica === null ? '' : numero(e.heuristica)}
                    </td>
                  )}
                  <td className="px-3 py-1.5 text-right text-[var(--texto-ahorro)]">{e.cumpleMeta ? 'Sí' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </Tarjeta>
  )
}

function FilaComparacion({ metrica, a, b }: { metrica: string; a: string | number; b: string | number }) {
  return (
    <tr className="border-t border-white/[0.08]">
      <td className="px-2 py-2.5 text-[var(--tinta-3)]">{metrica}</td>
      <td className="px-2 py-2.5 text-white tabular-nums">{a}</td>
      <td className="px-2 py-2.5 text-white tabular-nums">{b}</td>
    </tr>
  )
}

function Errores({ mensajes }: { mensajes: string[] }) {
  if (mensajes.length === 0) return null
  return (
    <Aviso>
      <ul>
        {mensajes.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    </Aviso>
  )
}
