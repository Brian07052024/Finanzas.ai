import { useCallback, useEffect, useState } from 'react'
import { mensajeDeError } from '../http'
import { Aviso } from '../ui/Aviso'
import { EsqueletoTarjeta, TextoCargando } from '../ui/Esqueleto'
import { borrarMovimiento, obtenerQuincenaActual, type QuincenaActual } from './api'
import { FormularioMovimiento } from './FormularioMovimiento'
import { ResumenQuincena } from './ResumenQuincena'

export function PaginaMovimientos() {
  const [quincena, setQuincena] = useState<QuincenaActual | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [borrando, setBorrando] = useState(false)

  const cargar = useCallback(async () => {
    try {
      setQuincena(await obtenerQuincenaActual())
      setError(null)
    } catch (e) {
      setError(mensajeDeError(e).join(' '))
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  async function borrar(id: number) {
    setBorrando(true)
    try {
      await borrarMovimiento(id)
      await cargar()
    } catch (e) {
      setError(mensajeDeError(e).join(' '))
    } finally {
      setBorrando(false)
    }
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[22rem_1fr]">
      <div className="lg:sticky lg:top-6">
        <FormularioMovimiento onRegistrado={cargar} />
      </div>

      <div className="min-w-0 space-y-4">
        {error && <Aviso>{error}</Aviso>}
        {quincena && <ResumenQuincena quincena={quincena} onBorrar={borrar} borrando={borrando} />}
        {!quincena && !error && (
          <>
            <TextoCargando />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <EsqueletoTarjeta alto="h-24" lineas={1} />
              <EsqueletoTarjeta alto="h-24" lineas={1} />
              <EsqueletoTarjeta alto="h-24" lineas={1} />
            </div>
            <EsqueletoTarjeta alto="h-[28rem]" lineas={7} />
          </>
        )}
      </div>
    </div>
  )
}
