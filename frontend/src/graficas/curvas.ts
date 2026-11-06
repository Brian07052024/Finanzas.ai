/**
 * Trazo suave que pasa por todos los puntos sin "inventar" subidas o bajadas:
 * interpolación cúbica monótona (Fritsch-Carlson). Si los datos solo suben, la curva solo sube,
 * a diferencia de una spline común, que puede pasarse del valor entre dos puntos.
 */
export function curvaMonotona(puntos: [number, number][]): string {
  const n = puntos.length
  if (n === 0) return ''
  if (n === 1) return `M ${puntos[0][0]} ${puntos[0][1]}`

  const pendientes: number[] = []
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = puntos[i]
    const [x1, y1] = puntos[i + 1]
    pendientes.push((y1 - y0) / (x1 - x0))
  }

  const tangentes: number[] = new Array(n)
  tangentes[0] = pendientes[0]
  tangentes[n - 1] = pendientes[n - 2]
  for (let i = 1; i < n - 1; i++) {
    const a = pendientes[i - 1]
    const b = pendientes[i]
    tangentes[i] = a * b <= 0 ? 0 : (a + b) / 2
  }
  for (let i = 0; i < n - 1; i++) {
    if (pendientes[i] === 0) {
      tangentes[i] = 0
      tangentes[i + 1] = 0
      continue
    }
    const alfa = tangentes[i] / pendientes[i]
    const beta = tangentes[i + 1] / pendientes[i]
    const suma = alfa * alfa + beta * beta
    if (suma > 9) {
      const t = 3 / Math.sqrt(suma)
      tangentes[i] = t * alfa * pendientes[i]
      tangentes[i + 1] = t * beta * pendientes[i]
    }
  }

  let d = `M ${puntos[0][0]} ${puntos[0][1]}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = puntos[i]
    const [x1, y1] = puntos[i + 1]
    const h = (x1 - x0) / 3
    d += ` C ${x0 + h} ${y0 + h * tangentes[i]}, ${x1 - h} ${y1 - h * tangentes[i + 1]}, ${x1} ${y1}`
  }
  return d
}
