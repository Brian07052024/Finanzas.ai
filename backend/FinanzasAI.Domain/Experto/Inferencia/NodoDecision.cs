namespace FinanzasAI.Domain.Experto.Inferencia;

/// <summary>
/// Nodo del árbol de decisión. Un árbol binario: cada pregunta tiene una rama Sí y una rama No,
/// y cada hoja es un diagnóstico.
/// </summary>
public abstract class NodoDecision
{
    public string Id { get; }

    protected NodoDecision(string id)
    {
        Id = id;
    }
}

/// <summary>
/// Nodo interno: una condición sobre la base de hechos. La condición y la observación se guardan
/// como funciones para que el árbol sea datos (se puede recorrer y mostrar) y a la vez ejecutable.
/// </summary>
public sealed class NodoPregunta : NodoDecision
{
    public string Pregunta { get; }
    public Regla? Regla { get; }
    public NodoDecision Si { get; }
    public NodoDecision No { get; }

    private readonly Func<HechosQuincena, bool> _condicion;
    private readonly Func<HechosQuincena, string> _observacion;

    public NodoPregunta(
        string id,
        string pregunta,
        Regla? regla,
        Func<HechosQuincena, bool> condicion,
        Func<HechosQuincena, string> observacion,
        NodoDecision si,
        NodoDecision no) : base(id)
    {
        Pregunta = pregunta;
        Regla = regla;
        _condicion = condicion;
        _observacion = observacion;
        Si = si;
        No = no;
    }

    public bool Evaluar(HechosQuincena hechos) => _condicion(hechos);

    public string Observar(HechosQuincena hechos) => _observacion(hechos);
}

/// <summary>Nodo hoja: la conclusión del sistema experto.</summary>
public sealed class NodoHoja : NodoDecision
{
    public Diagnostico Diagnostico { get; }

    public NodoHoja(string id, Diagnostico diagnostico) : base(id)
    {
        Diagnostico = diagnostico;
    }
}

public record Diagnostico(string Codigo, string Titulo, string Descripcion, bool RecomiendaPlan);
