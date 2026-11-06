# Spec: FinanzasAI

## Propósito

Aplicación web para el control de finanzas personales que incluye un **sistema experto** de apoyo a la toma de decisiones. Es el proyecto final de un curso (diseño de un sistema experto con algoritmos de búsqueda) y, al mismo tiempo, una herramienta de uso personal.

## Usuario

Un solo usuario: yo. Sin registro ni inicio de sesión.

## Problema detectado

Llevo registro de mis gastos, pero no sé qué decisiones tomar para alcanzar mi meta de ahorro de la quincena sin sacrificar lo esencial. Necesito un diagnóstico de mi quincena y un plan concreto de recortes, explicado.

## Requisitos del curso (resumen)

- Diseñar un sistema experto a partir de un problema detectado.
- Árbol de decisión del sistema.
- Programa con búsqueda exhaustiva y/o heurística que optimice la toma de decisiones.
- Temas: búsqueda exhaustiva y heurística, recorridos de árbol, ordenamiento, teoremas de flujo.
- Incluir: análisis de estados o árbol de decisión, soluciones, reglas o condiciones, optimización de la búsqueda y simulación del proceso de aprendizaje.
- Entregables: código, video de ejecución y explicación, exposición oral.

## Componentes del sistema experto

- **Base de hechos:** movimientos registrados (ingresos y gastos por categoría) de la quincena.
- **Base de conocimiento:** reglas de finanzas personales tomadas de fuentes documentadas (no inventadas).
- **Motor de inferencia:** árbol de decisión que diagnostica la quincena.
- **Módulo de explicación:** el camino recorrido en el árbol, mostrado al usuario.
- **Búsqueda de soluciones:** plan de recortes por categoría que alcance la meta de ahorro con el menor sacrificio.
  - Cada estado es una combinación de recortes por categoría.
  - Restricciones: las categorías esenciales no se recortan; cada categoría tiene un mínimo.
  - Búsqueda exhaustiva (BFS o DFS) y búsqueda heurística (A* o voraz), con métricas comparables (estados explorados, tiempo, calidad de la solución).
- **Aprendizaje:** al rechazar el recorte de una categoría, aumenta su costo de sacrificio y los siguientes planes se ajustan.
- **Interfaz:** registro de movimientos, diagnóstico con explicación, plan de recortes y comparación de búsquedas.

## Rebanadas para la entrega

Cada rebanada termina con algo funcionando y demostrable.

1. Registrar y listar movimientos (ingreso o gasto, monto, fecha, categoría, descripción opcional) con totales de la quincena actual.
2. Diagnóstico de la quincena con árbol de decisión, mostrando el camino recorrido como explicación.
3. Plan de recortes con búsqueda exhaustiva, mostrando estados explorados.
4. Plan de recortes con búsqueda heurística y comparación lado a lado con la exhaustiva.
5. Aprendizaje: rechazar un recorte ajusta los costos y cambia el siguiente plan.

Opcionales, solo si sobra tiempo:

6. Editar y borrar movimientos.
7. Modelo de flujo para la distribución del ingreso (teoremas de flujo).
8. Mejoras visuales del dashboard. Hecha: estilo glassmorphism oscuro, pestaña Inicio con gráficas, árbol y red de flujo dibujados en SVG.

## Fuera del alcance de la entrega

- Login, usuarios o multiusuario
- Categorías creadas o editadas por el usuario
- Tarjetas de crédito y compras a meses sin intereses
- "Disponible para gastar hoy"
- Captura con IA, importación de estados de cuenta o SMS
- PWA, notificaciones y alertas
- Vista mensual, gráficas elaboradas, filtros avanzados, exportaciones
- Más de una moneda
- Despliegue en línea

## Visión a largo plazo (después de la entrega)

- Captura en lenguaje natural y a partir de notificaciones del banco.
- Control de compras a meses sin intereses y tarjetas de crédito.
- "Disponible para gastar hoy" calculado contra la siguiente quincena.
- Detección de gastos hormiga y suscripciones recurrentes.

## Decisiones tomadas

- Moneda única: MXN. Los montos nunca se manejan como punto flotante.
- Trabajo por rebanadas verticales.
- El dashboard se organiza por quincena. Días de pago: el 15 y el último día de cada mes.
  - Quincena A: del día 15 al día anterior al último día del mes.
  - Quincena B: del último día del mes al día 14 del mes siguiente.
  - Las quincenas no duran siempre lo mismo; eso es esperado.
- Backend en tres proyectos: Domain (lógica pura), Api (controllers, DbContext, migraciones) y Tests (xUnit).
- El motor experto (árbol, búsquedas, aprendizaje) vive en Domain.
- Montos: `decimal` en C# y `numeric(12,2)` en Postgres; mayores que cero y con máximo dos decimales.
- Categorías de gasto (fijas), clasificadas según la regla 50/30/20:
  - Necesidades (esenciales, no se recortan): Vivienda, Supermercado, Transporte, Servicios, Salud, Educación.
  - Deseos (recortables): Restaurantes, Entretenimiento, Ropa, Suscripciones, Otros.
- Niveles de recorte por categoría de deseos: 0%, 25%, 50% o 75% de lo gastado. El mínimo de cada categoría es 25% de lo gastado (recorte paulatino, CONDUSEF).
- Meta de ahorro: 20% del ingreso por defecto (regla 50/30/20), editable y guardada en la base de datos.
- Reglas del árbol y sus fuentes: ver `docs/motor-experto.md`.
- Teoremas de flujo: flujo máximo (Edmonds-Karp) y corte mínimo sobre la distribución del ingreso 50/30/20 (ver `docs/motor-experto.md`).
- Los ingresos no llevan categoría; la categoría aplica solo a gastos.

## Stack

- Frontend: React + Vite + TypeScript, Tailwind CSS, Vitest
- Backend: ASP.NET Core Web API (.NET 10, controllers), Entity Framework Core con Npgsql
- Base de datos: PostgreSQL 17 en Docker Compose
- Pruebas: xUnit (backend), Vitest (frontend)
- Monorepo: `backend/`, `frontend/`, `docs/`

## Preguntas abiertas

- [x] Representación de montos: `decimal` en C# con `numeric(12,2)` en Postgres (ver Decisiones tomadas)
- [x] Lista exacta de categorías (ver Decisiones tomadas)
- [x] Cuáles categorías son esenciales y el mínimo de cada una (ver Decisiones tomadas)
- [x] Reglas del árbol de decisión con sus porcentajes y la fuente de cada una (ver `docs/motor-experto.md`)
- [x] Meta de ahorro de la quincena: 20% por defecto, editable (ver Decisiones tomadas)
- [ ] Confirmar con el profesor si los teoremas de flujo son obligatorios