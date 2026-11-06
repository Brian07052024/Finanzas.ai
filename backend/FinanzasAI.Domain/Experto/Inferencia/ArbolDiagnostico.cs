namespace FinanzasAI.Domain.Experto.Inferencia;

/// <summary>Una pregunta respondida durante la inferencia. El camino completo es la explicación.</summary>
public record PasoInferencia(string NodoId, string Pregunta, string Observado, bool Respuesta, Regla? Regla);

public record ResultadoDiagnostico(string HojaId, Diagnostico Diagnostico, IReadOnlyList<PasoInferencia> Camino);

/// <summary>Un nodo visitado en el recorrido en preorden, con su profundidad y la rama por la que se llegó.</summary>
public record NodoRecorrido(NodoDecision Nodo, int Profundidad, bool? RamaDesdePadre);

/// <summary>
/// Motor de inferencia: árbol de decisión que diagnostica la quincena.
///
/// Orden de las preguntas: primero lo que invalida el diagnóstico (sin ingresos), luego la meta
/// principal (R1, ahorro de 20%), después la gravedad (déficit, R2 ahorro mínimo de 10%) y al final
/// la causa (deseos por encima de 30%, R1). Si los deseos no pasan de 30% y el ahorro no llega a 20%,
/// por aritmética las necesidades pasan de 50%; por eso esas hojas se atribuyen a las necesidades.
/// </summary>
public static class ArbolDiagnostico
{
    public static NodoDecision Raiz { get; } = Construir();

    /// <summary>
    /// Inferencia: desciende desde la raíz evaluando cada pregunta contra los hechos hasta llegar
    /// a una hoja. Es un recorrido raíz-hoja; cada paso queda registrado como explicación.
    /// </summary>
    public static ResultadoDiagnostico Diagnosticar(HechosQuincena hechos)
    {
        var camino = new List<PasoInferencia>();
        var nodo = Raiz;

        while (nodo is NodoPregunta pregunta)
        {
            var respuesta = pregunta.Evaluar(hechos);
            camino.Add(new PasoInferencia(
                pregunta.Id, pregunta.Pregunta, pregunta.Observar(hechos), respuesta, pregunta.Regla));
            nodo = respuesta ? pregunta.Si : pregunta.No;
        }

        var hoja = (NodoHoja)nodo;
        return new ResultadoDiagnostico(hoja.Id, hoja.Diagnostico, camino);
    }

    /// <summary>
    /// Recorrido en preorden (nodo, rama Sí, rama No). Se usa para mostrar el árbol completo
    /// en la interfaz con sangría según la profundidad.
    /// </summary>
    public static IReadOnlyList<NodoRecorrido> RecorrerPreorden()
    {
        var resultado = new List<NodoRecorrido>();
        Visitar(Raiz, 0, null);
        return resultado;

        void Visitar(NodoDecision nodo, int profundidad, bool? rama)
        {
            resultado.Add(new NodoRecorrido(nodo, profundidad, rama));
            if (nodo is NodoPregunta pregunta)
            {
                Visitar(pregunta.Si, profundidad + 1, true);
                Visitar(pregunta.No, profundidad + 1, false);
            }
        }
    }

    private static NodoDecision Construir()
    {
        var r1 = BaseConocimiento.R1Regla503020;
        var r2 = BaseConocimiento.R2AhorroMinimo;

        var sinIngresos = new NodoHoja("H1", new Diagnostico(
            "SinIngresos",
            "Sin ingresos registrados",
            "No hay ingresos en esta quincena. Registra tu ingreso para poder diagnosticarla.",
            RecomiendaPlan: false));

        var saludable = new NodoHoja("H2", new Diagnostico(
            "Saludable",
            "Quincena saludable",
            "Tu ahorro alcanza al menos el 20% del ingreso (R1). No hace falta recortar.",
            RecomiendaPlan: false));

        var deficitPorDeseos = new NodoHoja("H3", new Diagnostico(
            "DeficitPorDeseos",
            "Déficit por gasto en deseos",
            "Gastas más de lo que ingresas y los deseos superan el 30% del ingreso (R1). " +
            "Recortar deseos es la vía principal para cerrar el déficit.",
            RecomiendaPlan: true));

        var deficitPorNecesidades = new NodoHoja("H4", new Diagnostico(
            "DeficitPorNecesidades",
            "Déficit por necesidades",
            "Gastas más de lo que ingresas aunque los deseos están dentro del 30%: las necesidades pasan del 50% (R1). " +
            "Recortar deseos ayuda, pero probablemente no baste; revisa tus gastos esenciales o tu ingreso.",
            RecomiendaPlan: true));

        var aceptablePorDeseos = new NodoHoja("H5", new Diagnostico(
            "AceptablePorDeseos",
            "Ahorro aceptable, deseos altos",
            "Ahorras entre 10% y 20% del ingreso: cumples el mínimo (R2) pero no la meta (R1). " +
            "Los deseos superan el 30%; recortarlos te acerca a la meta.",
            RecomiendaPlan: true));

        var aceptablePorNecesidades = new NodoHoja("H6", new Diagnostico(
            "AceptablePorNecesidades",
            "Ahorro aceptable, necesidades altas",
            "Ahorras entre 10% y 20% del ingreso: cumples el mínimo (R2) pero no la meta (R1). " +
            "Los deseos están dentro del 30%, así que las necesidades pasan del 50%; los recortes en deseos ayudan poco.",
            RecomiendaPlan: true));

        var insuficientePorDeseos = new NodoHoja("H7", new Diagnostico(
            "InsuficientePorDeseos",
            "Ahorro insuficiente por deseos",
            "Ahorras menos del 10% del ingreso (R2) y los deseos superan el 30% (R1). " +
            "Recortar deseos es la vía principal para llegar a la meta.",
            RecomiendaPlan: true));

        var insuficientePorNecesidades = new NodoHoja("H8", new Diagnostico(
            "InsuficientePorNecesidades",
            "Ahorro insuficiente por necesidades",
            "Ahorras menos del 10% del ingreso (R2) y los deseos están dentro del 30%: las necesidades pasan del 50% (R1). " +
            "Recortar deseos ayuda, pero probablemente no baste.",
            RecomiendaPlan: true));

        NodoPregunta DeseosAltos(string id, NodoDecision si, NodoDecision no) => new(
            id,
            "¿Los deseos superan el 30% del ingreso?",
            r1,
            h => h.Deseos > h.Ingresos * BaseConocimiento.FraccionMaximaDeseos,
            h => $"Deseos: {Formato.Moneda(h.Deseos)} ({Formato.Porcentaje(h.PorcentajeDelIngreso(h.Deseos))} del ingreso)",
            si,
            no);

        var ahorroMinimo = new NodoPregunta(
            "P5",
            "¿El ahorro es al menos 10% del ingreso?",
            r2,
            h => h.Ahorro >= h.Ingresos * BaseConocimiento.FraccionAhorroMinima,
            h => $"Ahorro: {Formato.Moneda(h.Ahorro)} ({Formato.Porcentaje(h.PorcentajeDelIngreso(h.Ahorro))} del ingreso)",
            si: DeseosAltos("P6", aceptablePorDeseos, aceptablePorNecesidades),
            no: DeseosAltos("P7", insuficientePorDeseos, insuficientePorNecesidades));

        var deficit = new NodoPregunta(
            "P3",
            "¿Los gastos superan a los ingresos?",
            null,
            h => h.Gastos > h.Ingresos,
            h => $"Gastos: {Formato.Moneda(h.Gastos)}; ingresos: {Formato.Moneda(h.Ingresos)}",
            si: DeseosAltos("P4", deficitPorDeseos, deficitPorNecesidades),
            no: ahorroMinimo);

        var metaAhorro = new NodoPregunta(
            "P2",
            "¿El ahorro es al menos 20% del ingreso?",
            r1,
            h => h.Ahorro >= h.Ingresos * BaseConocimiento.FraccionAhorroRecomendada,
            h => $"Ahorro: {Formato.Moneda(h.Ahorro)} ({Formato.Porcentaje(h.PorcentajeDelIngreso(h.Ahorro))} del ingreso)",
            si: saludable,
            no: deficit);

        return new NodoPregunta(
            "P1",
            "¿Hay ingresos registrados en la quincena?",
            null,
            h => h.Ingresos > 0,
            h => $"Ingresos: {Formato.Moneda(h.Ingresos)}",
            si: metaAhorro,
            no: sinIngresos);
    }
}
