/** Errores de validación devueltos por la API (400 con ValidationProblemDetails). */
export class ErrorDeValidacion extends Error {
  readonly mensajes: string[]

  constructor(mensajes: string[]) {
    super(mensajes.join(' '))
    this.mensajes = mensajes
  }
}

/** Llama a la API y devuelve el JSON. Un 400 se convierte en ErrorDeValidacion. */
export async function pedir<T>(url: string, init?: RequestInit): Promise<T> {
  const respuesta = await fetch(url, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  })

  if (respuesta.status === 400) {
    const problema: { errors?: Record<string, string[]> } = await respuesta.json()
    const mensajes = Object.values(problema.errors ?? {}).flat()
    throw new ErrorDeValidacion(mensajes.length > 0 ? mensajes : ['Datos inválidos.'])
  }
  if (!respuesta.ok) {
    throw new Error(`La API respondió HTTP ${respuesta.status}.`)
  }
  if (respuesta.status === 204) {
    return undefined as T
  }
  return respuesta.json()
}

export function mensajeDeError(error: unknown): string[] {
  if (error instanceof ErrorDeValidacion) return error.mensajes
  return [error instanceof Error ? error.message : 'Error inesperado.']
}
