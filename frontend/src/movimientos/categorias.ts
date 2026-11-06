import type { Categoria } from './api'

// Debe coincidir con el enum Categoria de FinanzasAI.Domain y con su clasificación
// en BaseConocimiento.EsNecesidad (regla 50/30/20).
export const CATEGORIAS: { valor: Categoria; etiqueta: string; esNecesidad: boolean }[] = [
  { valor: 'Vivienda', etiqueta: 'Vivienda', esNecesidad: true },
  { valor: 'Supermercado', etiqueta: 'Supermercado', esNecesidad: true },
  { valor: 'Transporte', etiqueta: 'Transporte', esNecesidad: true },
  { valor: 'Servicios', etiqueta: 'Servicios', esNecesidad: true },
  { valor: 'Salud', etiqueta: 'Salud', esNecesidad: true },
  { valor: 'Educacion', etiqueta: 'Educación', esNecesidad: true },
  { valor: 'Restaurantes', etiqueta: 'Restaurantes', esNecesidad: false },
  { valor: 'Entretenimiento', etiqueta: 'Entretenimiento', esNecesidad: false },
  { valor: 'Ropa', etiqueta: 'Ropa', esNecesidad: false },
  { valor: 'Suscripciones', etiqueta: 'Suscripciones', esNecesidad: false },
  { valor: 'Otros', etiqueta: 'Otros', esNecesidad: false },
]

export function etiquetaCategoria(categoria: Categoria): string {
  return CATEGORIAS.find((c) => c.valor === categoria)?.etiqueta ?? categoria
}

/** Etiqueta de un nodo de la red de flujo: si el nombre es una categoría, su etiqueta con acentos. */
export function etiquetaNodo(nombre: string): string {
  return CATEGORIAS.some((c) => c.valor === nombre) ? etiquetaCategoria(nombre as Categoria) : nombre
}
