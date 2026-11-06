/**
 * Tarjeta de carga: misma forma que una tarjeta real, con barras que brillan. Se muestra mientras
 * llegan los datos, con la altura aproximada de la tarjeta que va a reemplazar, para que nada brinque.
 */
export function EsqueletoTarjeta({ alto, lineas = 3 }: { alto: string; lineas?: number }) {
  return (
    <div className={`placa flex flex-col gap-4 rounded-[1.6rem] p-6 ${alto}`} aria-hidden="true">
      <div className="esqueleto-linea h-4 w-40" />
      {Array.from({ length: lineas }, (_, i) => (
        <div key={i} className="esqueleto-linea h-3" style={{ width: `${88 - i * 17}%` }} />
      ))}
    </div>
  )
}

/** Indicador de carga para lectores de pantalla; lo visual lo dan los esqueletos. */
export function TextoCargando() {
  return (
    <p className="sr-only" role="status">
      Cargando...
    </p>
  )
}
