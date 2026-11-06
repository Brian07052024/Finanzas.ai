import { useEffect, useState } from 'react'
import { fecha, moneda } from '../formato'
import { ArbolDecision } from '../graficas/ArbolDecision'
import { BarraPresupuesto } from '../graficas/BarraPresupuesto'
import { mensajeDeError } from '../http'
import { Aviso } from '../ui/Aviso'
import { Boton } from '../ui/Boton'
import { Chip } from '../ui/Chip'
import { Dato } from '../ui/Dato'
import { EsqueletoTarjeta, TextoCargando } from '../ui/Esqueleto'
import { IconoDiagnostico, IconoReglas, IconoTabla } from '../ui/iconos'
import { Tarjeta } from '../ui/Tarjeta'
import { obtenerDiagnostico, type Diagnostico } from './api'

interface Props {
  onVerPlan: () => void
}

export function PaginaDiagnostico({ onVerPlan }: Props) {
  const [datos, setDatos] = useState<Diagnostico | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    obtenerDiagnostico().then(setDatos, (e) => setError(mensajeDeError(e).join(' ')))
  }, [])

  if (error) return <Aviso>{error}</Aviso>
  if (!datos)
    return (
      <div className="space-y-6">
        <TextoCargando />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem]">
          <EsqueletoTarjeta alto="h-72" lineas={4} />
          <EsqueletoTarjeta alto="h-72" lineas={4} />
        </div>
        <EsqueletoTarjeta alto="h-[36rem]" lineas={6} />
      </div>
    )

  const { hechos, diagnostico } = datos

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem]">
        <Tarjeta
          titulo="Base de hechos"
          icono={<IconoTabla />}
          accion={
            <Chip tono="neutro">
              {fecha(datos.inicio)} – {fecha(datos.fin)}
            </Chip>
          }
        >
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
            <Dato plano titulo="Ingresos" valor={moneda(hechos.ingresos)} />
            <Dato
              plano
              titulo="Necesidades"
              valor={moneda(hechos.necesidades)}
              detalle={`${hechos.porcentajeNecesidades}% · máx. 50%`}
            />
            <Dato plano titulo="Deseos" valor={moneda(hechos.deseos)} detalle={`${hechos.porcentajeDeseos}% · máx. 30%`} />
            <Dato
              plano
              titulo="Ahorro"
              valor={moneda(hechos.ahorro)}
              detalle={`${hechos.porcentajeAhorro}% · mín. 20%`}
              tono={hechos.ahorro < 0 ? 'text-[var(--texto-gasto)]' : 'text-white'}
            />
          </dl>
          <BarraPresupuesto
            ingresos={hechos.ingresos}
            necesidades={hechos.necesidades}
            deseos={hechos.deseos}
            ahorro={hechos.ahorro}
          />
        </Tarjeta>

        <Tarjeta
          variante="vidrio"
          titulo="Conclusión"
          accion={<Chip tono={diagnostico.recomiendaPlan ? 'ambar' : 'turquesa'}>{diagnostico.hojaId}</Chip>}
        >
          <div className="space-y-2">
            <p className="text-xl leading-snug text-white">{diagnostico.titulo}</p>
            <p className="text-sm leading-relaxed text-[var(--tinta-3)]">{diagnostico.descripcion}</p>
          </div>
          {diagnostico.recomiendaPlan && (
            <Boton className="w-full" onClick={onVerPlan}>
              Ver plan de recortes
            </Boton>
          )}
        </Tarjeta>
      </div>

      <Tarjeta
        variante="vidrio"
        titulo="Árbol de decisión"
        icono={<IconoDiagnostico />}
        accion={<span className="text-sm text-[var(--tinta-3)]">El camino recorrido va en azul</span>}
      >
        <ArbolDecision nodos={datos.arbol} reglas={datos.reglas} />
      </Tarjeta>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Tarjeta titulo="Explicación paso a paso">
          <ol className="space-y-4">
            {datos.camino.map((paso, i) => (
              <li key={paso.nodoId} className="grid grid-cols-[1.75rem_1fr] gap-3">
                <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-xs text-[var(--tinta-2)]">
                  {i + 1}
                </span>
                <div className="space-y-1">
                  <p className="text-[var(--tinta-1)]">
                    {paso.pregunta}{' '}
                    <span className={paso.respuesta ? 'text-[var(--texto-ahorro)]' : 'text-[var(--texto-gasto)]'}>
                      {paso.respuesta ? 'Sí' : 'No'}
                    </span>
                  </p>
                  <p className="flex flex-wrap items-center gap-2 text-sm text-[var(--tinta-3)]">
                    {paso.observado}
                    {paso.regla && <Chip tono="azul">{paso.regla}</Chip>}
                  </p>
                </div>
              </li>
            ))}
            <li className="grid grid-cols-[1.75rem_1fr] gap-3">
              <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--acento)] text-xs text-white">
                ✓
              </span>
              <p className="pt-0.5 text-[var(--texto-ingreso)]">{diagnostico.titulo}</p>
            </li>
          </ol>
        </Tarjeta>

        <Tarjeta titulo="Base de conocimiento" icono={<IconoReglas />}>
          <ul className="space-y-5">
            {datos.reglas.map((regla) => (
              <li key={regla.codigo} className="space-y-1.5">
                <p className="flex items-start gap-3 text-[var(--tinta-1)]">
                  <Chip tono="azul">{regla.codigo}</Chip>
                  <span>{regla.enunciado}</span>
                </p>
                <p className="pl-12 text-sm text-[var(--tinta-3)]">Fuente: {regla.fuente}</p>
              </li>
            ))}
          </ul>
        </Tarjeta>
      </div>
    </div>
  )
}
