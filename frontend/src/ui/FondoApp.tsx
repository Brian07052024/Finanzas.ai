/**
 * Fondo de la app: una imagen de formas líquidas cromadas (public/bgImg.webp) con una capa oscura encima.
 * Es lo que se ve difuminado a través de las tarjetas de vidrio; sin algo detrás, el vidrio se vería plano.
 * La capa oscura baja los brillos de la imagen para que el texto de las tarjetas conserve su contraste,
 * y es más densa abajo, donde suele haber más tablas y texto.
 */
const CAPA_OSCURA = [
  'radial-gradient(120% 90% at 50% 40%, rgba(8, 9, 14, 0.45), rgba(8, 9, 14, 0.82))',
  'linear-gradient(180deg, rgba(8, 9, 14, 0.35) 0%, rgba(8, 9, 14, 0.6) 100%)',
].join(', ')

export function FondoApp() {
  return (
    <div
      aria-hidden="true"
      className="fondo-app pointer-events-none fixed inset-0 -z-10"
      style={{
        backgroundColor: 'var(--fondo)',
        backgroundImage: `${CAPA_OSCURA}, url(/bgImg.webp)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    />
  )
}
