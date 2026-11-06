const formatoMoneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

const formatoNumero = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const formatoFecha = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

export function moneda(monto: number): string {
  return formatoMoneda.format(monto)
}

/** Número con separador de miles y dos decimales, para valores que no son dinero (sacrificio, heurística). */
export function numero(valor: number): string {
  return formatoNumero.format(valor)
}

// Las fechas llegan como "YYYY-MM-DD". Se construyen en hora local para que
// la conversión a UTC no las corra un día.
export function fecha(valor: string): string {
  const [anio, mes, dia] = valor.split('-').map(Number)
  return formatoFecha.format(new Date(anio, mes - 1, dia))
}
