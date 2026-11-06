import { pedir } from '../http'

export type TipoMovimiento = 'Ingreso' | 'Gasto'

export type Categoria =
  | 'Vivienda'
  | 'Supermercado'
  | 'Restaurantes'
  | 'Transporte'
  | 'Servicios'
  | 'Salud'
  | 'Educacion'
  | 'Entretenimiento'
  | 'Ropa'
  | 'Suscripciones'
  | 'Otros'

export interface Movimiento {
  id: number
  tipo: TipoMovimiento
  monto: number
  fecha: string
  categoria: Categoria | null
  descripcion: string | null
}

export interface QuincenaActual {
  inicio: string
  fin: string
  totalIngresos: number
  totalGastos: number
  balance: number
  movimientos: Movimiento[]
}

export interface NuevoMovimiento {
  tipo: TipoMovimiento
  monto: number
  fecha: string
  categoria: Categoria | null
  descripcion: string | null
}

export function obtenerQuincenaActual(): Promise<QuincenaActual> {
  return pedir('/api/movimientos/quincena-actual')
}

export function crearMovimiento(movimiento: NuevoMovimiento): Promise<Movimiento> {
  return pedir('/api/movimientos', { method: 'POST', body: JSON.stringify(movimiento) })
}

export function borrarMovimiento(id: number): Promise<void> {
  return pedir(`/api/movimientos/${id}`, { method: 'DELETE' })
}
