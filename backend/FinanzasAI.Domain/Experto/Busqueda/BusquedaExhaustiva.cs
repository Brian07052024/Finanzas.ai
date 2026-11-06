using System.Diagnostics;

namespace FinanzasAI.Domain.Experto.Busqueda;

/// <summary>
/// Búsqueda exhaustiva en anchura (BFS).
///
/// Recorre el espacio de estados por niveles con una cola FIFO: primero el estado sin recortes,
/// luego todos los que tienen un paso de recorte, luego dos, y así. Un conjunto de visitados evita
/// procesar dos veces el mismo estado (al mismo estado se llega por varios caminos, por ejemplo
/// recortar Ropa y luego Restaurantes o al revés).
///
/// No se detiene en la primera meta: en este problema el costo no depende de la profundidad
/// (un paso en una categoría cara cuesta más que dos en una barata), así que la primera meta de BFS
/// no es necesariamente la de menor sacrificio. Para garantizar el óptimo evalúa todos los estados
/// y se queda con la meta de menor costo. Por eso explora siempre 4^n estados.
/// </summary>
public static class BusquedaExhaustiva
{
    public const string Nombre = "Exhaustiva (BFS)";

    public static ResultadoBusqueda Ejecutar(ProblemaRecortes problema)
    {
        var cronometro = Stopwatch.StartNew();
        var traza = new List<EstadoExplorado>();

        var inicial = problema.EstadoInicial;
        var frontera = new Queue<EstadoRecortes>();
        var visitados = new HashSet<EstadoRecortes> { inicial };
        frontera.Enqueue(inicial);

        EstadoRecortes? mejor = null;
        decimal mejorCosto = 0;

        while (frontera.Count > 0)
        {
            var estado = frontera.Dequeue();
            var costo = problema.Costo(estado);
            var cumpleMeta = problema.EsMeta(estado);
            traza.Add(new EstadoExplorado(
                traza.Count + 1, estado, problema.Recortado(estado), costo, null, cumpleMeta));

            // En empate se queda la primera encontrada, que es la de menos pasos de recorte.
            if (cumpleMeta && (mejor is null || costo < mejorCosto))
            {
                mejor = estado;
                mejorCosto = costo;
            }

            foreach (var sucesor in problema.Sucesores(estado))
            {
                if (visitados.Add(sucesor))
                    frontera.Enqueue(sucesor);
            }
        }

        cronometro.Stop();
        return new ResultadoBusqueda(
            Nombre,
            mejor,
            mejor is null ? null : mejorCosto,
            traza.Count,
            visitados.Count,
            cronometro.Elapsed,
            traza);
    }
}
