import { pedir } from '../http'
import type { Categoria } from '../movimientos/api'

export interface Regla {
  codigo: string
  enunciado: string
  fuente: string
}

export interface Hechos {
  ingresos: number
  necesidades: number
  deseos: number
  ahorro: number
  porcentajeNecesidades: number
  porcentajeDeseos: number
  porcentajeAhorro: number
  gastosPorCategoria: { categoria: Categoria; esNecesidad: boolean; monto: number }[]
}

export interface PasoInferencia {
  nodoId: string
  pregunta: string
  observado: string
  respuesta: boolean
  regla: string | null
}

export interface NodoArbol {
  id: string
  texto: string
  profundidad: number
  rama: boolean | null
  esHoja: boolean
  regla: string | null
  enCamino: boolean
}

export interface Diagnostico {
  inicio: string
  fin: string
  hechos: Hechos
  diagnostico: {
    hojaId: string
    codigo: string
    titulo: string
    descripcion: string
    recomiendaPlan: boolean
  }
  camino: PasoInferencia[]
  arbol: NodoArbol[]
  reglas: Regla[]
}

export interface RecortePlan {
  categoria: Categoria
  gastoActual: number
  porcentaje: number
  montoRecortado: number
  peso: number
  sacrificio: number
}

export interface PlanRecortes {
  recortes: RecortePlan[]
  totalRecortado: number
  sacrificio: number
  ahorroResultante: number
  meta: number
  cumpleMeta: boolean
}

export interface EstadoExplorado {
  orden: number
  descripcion: string
  recortado: number
  costo: number
  heuristica: number | null
  cumpleMeta: boolean
}

export interface ResultadoBusqueda {
  algoritmo: string
  plan: PlanRecortes | null
  sacrificio: number | null
  estadosExplorados: number
  estadosGenerados: number
  tiempoMs: number
  traza: EstadoExplorado[]
  trazaTruncada: boolean
}

export interface Plan {
  inicio: string
  fin: string
  porcentajeMeta: number
  meta: number
  ahorroActual: number
  faltante: number
  alcanzable: boolean
  ahorroMaximoPosible: number
  totalEstados: number
  categorias: { categoria: Categoria; gasto: number; peso: number }[]
  busquedas: ResultadoBusqueda[]
}

export interface PesoSacrificio {
  categoria: Categoria
  peso: number
  rechazos: number
}

export function obtenerDiagnostico(): Promise<Diagnostico> {
  return pedir('/api/diagnostico')
}

export function obtenerPlan(): Promise<Plan> {
  return pedir('/api/plan')
}

export function cambiarMeta(porcentajeMeta: number): Promise<{ porcentajeMeta: number }> {
  return pedir('/api/plan/meta', { method: 'PUT', body: JSON.stringify({ porcentajeMeta }) })
}

export function obtenerPesos(): Promise<PesoSacrificio[]> {
  return pedir('/api/plan/pesos')
}

export function rechazarRecorte(categoria: Categoria): Promise<PesoSacrificio[]> {
  return pedir('/api/plan/rechazos', { method: 'POST', body: JSON.stringify({ categoria }) })
}

export function reiniciarAprendizaje(): Promise<void> {
  return pedir('/api/plan/pesos', { method: 'DELETE' })
}

export interface Flujo {
  inicio: string
  fin: string
  ingresos: number
  demandaTotal: number
  flujoMaximo: number
  capacidadCorte: number
  ingresoSinAsignar: number
  demandaSinCubrir: number
  sobres: { nombre: string; tope: number; demanda: number; asignado: number }[]
  categorias: { categoria: Categoria; esNecesidad: boolean; gasto: number; asignado: number; sinCubrir: number }[]
  caminos: { numero: number; nodos: string[]; cuello: number }[]
  corte: { desde: string; hacia: string; capacidad: number; interpretacion: string }[]
  aristas: { desde: string; hacia: string; capacidad: number; flujo: number; enCorte: boolean }[]
}

export function obtenerFlujo(): Promise<Flujo> {
  return pedir('/api/flujo')
}
