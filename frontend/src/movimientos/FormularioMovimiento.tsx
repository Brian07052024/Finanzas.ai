import { useState, type FormEvent } from 'react'
import { mensajeDeError } from '../http'
import { Boton } from '../ui/Boton'
import { crearMovimiento, type Categoria, type TipoMovimiento } from './api'
import { CATEGORIAS } from './categorias'

function hoyLocal(): string {
  const hoy = new Date()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')
  return `${hoy.getFullYear()}-${mes}-${dia}`
}

interface Props {
  onRegistrado: () => void
}

export function FormularioMovimiento({ onRegistrado }: Props) {
  const [tipo, setTipo] = useState<TipoMovimiento>('Gasto')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(hoyLocal)
  const [categoria, setCategoria] = useState<Categoria | ''>('')
  const [descripcion, setDescripcion] = useState('')
  const [errores, setErrores] = useState<string[]>([])
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErrores([])
    setEnviando(true)
    try {
      await crearMovimiento({
        tipo,
        monto: Number(monto),
        fecha,
        categoria: tipo === 'Gasto' && categoria !== '' ? categoria : null,
        descripcion: descripcion.trim() === '' ? null : descripcion,
      })
      setMonto('')
      setDescripcion('')
      onRegistrado()
    } catch (error) {
      setErrores(mensajeDeError(error))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={enviar} className="vidrio entrada space-y-5 rounded-[1.6rem] p-5 sm:p-6">
      <h2 className="text-[1.05rem] font-medium text-white">Registrar movimiento</h2>

      <fieldset className="inline-flex rounded-full border-[1.5px] border-white/15 p-1">
        <legend className="sr-only">Tipo</legend>
        {(['Gasto', 'Ingreso'] as const).map((opcion) => (
          <label
            key={opcion}
            className={`cursor-pointer rounded-full px-5 py-1.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--acento-claro)] ${
              tipo === opcion ? 'bg-[var(--acento)] text-white' : 'text-[var(--tinta-2)] hover:text-white'
            }`}
          >
            <input
              type="radio"
              name="tipo"
              value={opcion}
              checked={tipo === opcion}
              onChange={() => setTipo(opcion)}
              className="sr-only"
            />
            {opcion}
          </label>
        ))}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <label className="block">
          <span className="etiqueta">Monto (MXN)</span>
          <input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            required
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="campo"
          />
        </label>

        <label className="block">
          <span className="etiqueta">Fecha</span>
          <input
            type="date"
            required
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="campo"
          />
        </label>
      </div>

      {tipo === 'Gasto' && (
        <label className="block">
          <span className="etiqueta">Categoría</span>
          <select
            required
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as Categoria | '')}
            className="campo"
          >
            <option value="" disabled>
              Elige una categoría
            </option>
            <optgroup label="Necesidades">
              {CATEGORIAS.filter((c) => c.esNecesidad).map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.etiqueta}
                </option>
              ))}
            </optgroup>
            <optgroup label="Deseos">
              {CATEGORIAS.filter((c) => !c.esNecesidad).map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.etiqueta}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
      )}

      <label className="block">
        <span className="etiqueta">Descripción (opcional)</span>
        <input
          type="text"
          maxLength={200}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="campo"
        />
      </label>

      {errores.length > 0 && (
        <ul role="alert" className="rounded-2xl border border-red-400/40 px-4 py-3 text-sm text-red-300">
          {errores.map((mensaje) => (
            <li key={mensaje}>{mensaje}</li>
          ))}
        </ul>
      )}

      <Boton type="submit" disabled={enviando} className="w-full sm:w-auto">
        {enviando ? 'Guardando...' : 'Registrar'}
      </Boton>
    </form>
  )
}
