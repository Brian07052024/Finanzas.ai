import { useState } from 'react'
import { fecha, moneda } from '../formato'
import { Boton } from '../ui/Boton'
import { Chip } from '../ui/Chip'
import { Dato } from '../ui/Dato'
import { Tarjeta } from '../ui/Tarjeta'
import type { QuincenaActual } from './api'
import { CATEGORIAS, etiquetaCategoria } from './categorias'
import { IconoTabla } from '../ui/iconos'

interface Props {
  quincena: QuincenaActual
  onBorrar: (id: number) => void
  borrando: boolean
}

export function ResumenQuincena({ quincena, onBorrar, borrando }: Props) {
  const [confirmando, setConfirmando] = useState<number | null>(null)
  const esNecesidad = new Map(CATEGORIAS.map((c) => [c.valor, c.esNecesidad]))

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Dato titulo="Ingresos" valor={moneda(quincena.totalIngresos)} />
        <Dato titulo="Gastos" valor={moneda(quincena.totalGastos)} />
        <Dato
          titulo="Balance"
          valor={moneda(quincena.balance)}
          tono={quincena.balance < 0 ? 'text-[var(--texto-gasto)]' : 'text-[var(--texto-saldo)]'}
        />
      </dl>

      <Tarjeta
        titulo="Movimientos"
        icono={<IconoTabla />}
        accion={
          <Chip tono="neutro">
            {fecha(quincena.inicio)} – {fecha(quincena.fin)}
          </Chip>
        }
      >
        {quincena.movimientos.length === 0 ? (
          <p className="text-[var(--tinta-3)]">Aún no hay movimientos en esta quincena.</p>
        ) : (
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[var(--tinta-3)]">
                <tr>
                  <th className="px-2 pb-3 font-normal">Fecha</th>
                  <th className="px-2 pb-3 font-normal">Categoría</th>
                  <th className="px-2 pb-3 font-normal">Descripción</th>
                  <th className="px-2 pb-3 text-right font-normal">Monto</th>
                  <th className="px-2 py-2" aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {quincena.movimientos.map((m) => (
                  <tr key={m.id} className="border-t border-white/[0.08]">
                    <td className="px-2 py-3 whitespace-nowrap text-[var(--tinta-3)]">{fecha(m.fecha)}</td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      {m.categoria ? (
                        <span className="inline-flex items-center gap-2 text-[var(--tinta-1)]">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              background: esNecesidad.get(m.categoria) ? 'var(--serie-necesidades)' : 'var(--serie-deseos)',
                            }}
                            aria-hidden="true"
                          />
                          {etiquetaCategoria(m.categoria)}
                        </span>
                      ) : (
                        <Chip tono="azul">Ingreso</Chip>
                      )}
                    </td>
                    <td className="px-2 py-3 text-[var(--tinta-3)]">{m.descripcion ?? ''}</td>
                    <td
                      className={`px-2 py-3 text-right whitespace-nowrap tabular-nums ${m.tipo === 'Gasto' ? 'text-[var(--tinta-1)]' : 'text-[var(--texto-ingreso)]'}`}
                    >
                      {m.tipo === 'Gasto' ? '-' : '+'}
                      {moneda(m.monto)}
                    </td>
                    <td className="px-2 py-3 text-right whitespace-nowrap">
                      {confirmando === m.id ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--tinta-2)]">
                          ¿Borrar?
                          <Boton
                            variante="peligro"
                            tamano="chico"
                            disabled={borrando}
                            onClick={() => {
                              setConfirmando(null)
                              onBorrar(m.id)
                            }}
                          >
                            Sí
                          </Boton>
                          <Boton variante="secundario" tamano="chico" onClick={() => setConfirmando(null)}>
                            No
                          </Boton>
                        </span>
                      ) : (
                        <Boton
                          variante="peligro"
                          tamano="chico"
                          disabled={borrando}
                          onClick={() => setConfirmando(m.id)}
                          aria-label={`Borrar movimiento de ${moneda(m.monto)}`}
                        >
                          Borrar
                        </Boton>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </div>
  )
}
