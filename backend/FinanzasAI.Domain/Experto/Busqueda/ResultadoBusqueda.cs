namespace FinanzasAI.Domain.Experto.Busqueda;

/// <summary>Un estado sacado de la frontera y evaluado, en el orden en que la búsqueda lo exploró.</summary>
public record EstadoExplorado(
    int Orden,
    EstadoRecortes Estado,
    decimal Recortado,
    decimal Costo,
    decimal? Heuristica,
    bool CumpleMeta);

/// <summary>
/// Resultado de una búsqueda con sus métricas comparables.
/// EstadosExplorados: estados sacados de la frontera y evaluados.
/// EstadosGenerados: estados distintos que llegaron a la frontera.
/// </summary>
public record ResultadoBusqueda(
    string Algoritmo,
    EstadoRecortes? Solucion,
    decimal? Costo,
    int EstadosExplorados,
    int EstadosGenerados,
    TimeSpan Tiempo,
    IReadOnlyList<EstadoExplorado> Traza);
