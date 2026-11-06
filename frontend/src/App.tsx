import { useState, type ReactNode } from 'react'
import { PaginaDiagnostico } from './experto/PaginaDiagnostico'
import { PaginaFlujo } from './experto/PaginaFlujo'
import { PaginaPlan } from './experto/PaginaPlan'
import { PaginaInicio } from './inicio/PaginaInicio'
import { PaginaMovimientos } from './movimientos/PaginaMovimientos'
import { Escalonado } from './ui/Escalonado'
import { FondoApp } from './ui/FondoApp'
import { IconoDiagnostico, IconoFlujo, IconoInicio, IconoMovimientos, IconoPlan, Logo } from './ui/iconos'

export type Pestana = 'inicio' | 'movimientos' | 'diagnostico' | 'plan' | 'flujo'

const PESTANAS: { id: Pestana; etiqueta: string; icono: ReactNode }[] = [
  { id: 'inicio', etiqueta: 'Inicio', icono: <IconoInicio /> },
  { id: 'movimientos', etiqueta: 'Movimientos', icono: <IconoMovimientos /> },
  { id: 'diagnostico', etiqueta: 'Diagnóstico', icono: <IconoDiagnostico /> },
  { id: 'plan', etiqueta: 'Plan de recortes', icono: <IconoPlan /> },
  { id: 'flujo', etiqueta: 'Flujo del ingreso', icono: <IconoFlujo /> },
]

function App() {
  const [pestana, setPestana] = useState<Pestana>('inicio')

  return (
    <div className="relative min-h-screen text-[var(--tinta-1)]">
      <FondoApp />
      <main className="mx-auto max-w-6xl space-y-7 px-4 py-6 sm:px-6 sm:py-9">
        <header className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <h1 className="text-[1.45rem] leading-tight font-medium tracking-tight text-white">Finanzas.ai</h1>
              <p className="text-sm text-[var(--tinta-3)]">Tu quincena, con criterio</p>
            </div>
          </div>
          <nav
            className="vidrio -mx-1 flex max-w-full gap-1 overflow-x-auto rounded-full p-1.5"
            aria-label="Secciones"
          >
            {PESTANAS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPestana(p.id)}
                aria-current={pestana === p.id ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
                  pestana === p.id ? 'bg-[var(--acento)] text-white' : 'text-[var(--tinta-2)] hover:text-white'
                }`}
              >
                {p.icono}
                {p.etiqueta}
              </button>
            ))}
          </nav>
        </header>

        {/* Cada sección tiene su propio Escalonado: sus tarjetas entran una tras otra al aparecer. */}
        <Escalonado key={pestana}>
          {pestana === 'inicio' && <PaginaInicio onIr={setPestana} />}
          {pestana === 'movimientos' && <PaginaMovimientos />}
          {pestana === 'diagnostico' && <PaginaDiagnostico onVerPlan={() => setPestana('plan')} />}
          {pestana === 'plan' && <PaginaPlan />}
          {pestana === 'flujo' && <PaginaFlujo />}
        </Escalonado>
      </main>
    </div>
  )
}

export default App
