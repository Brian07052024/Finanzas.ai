using System.Diagnostics;

namespace FinanzasAI.Domain.Experto.Busqueda;

/// <summary>
/// Búsqueda heurística A*.
///
/// La frontera es una cola de prioridad (un montículo binario) ordenada por f = g + h:
/// - g: sacrificio del estado (lo ya recortado, ponderado por peso).
/// - h: estimación optimista del sacrificio que falta para llegar a la meta (ver ProblemaRecortes.Heuristica).
///
/// En cada paso saca el estado con menor f. Como h es admisible y consistente, la primera meta
/// que sale de la frontera es la de menor sacrificio y puede detenerse ahí, sin recorrer todo el
/// espacio como BFS. En empate de f prefiere el estado con menor h (el más cercano a la meta) y luego
/// el que entró primero, para que el resultado sea determinista.
///
/// Como g depende solo del estado y no del camino, un estado que ya entró a la frontera nunca
/// mejora su costo; basta con un conjunto de estados vistos.
/// </summary>
public static class BusquedaAEstrella
{
    public const string Nombre = "Heurística (A*)";

    public static ResultadoBusqueda Ejecutar(ProblemaRecortes problema)
    {
        var cronometro = Stopwatch.StartNew();
        var traza = new List<EstadoExplorado>();

        var frontera = new PriorityQueue<EstadoRecortes, (decimal F, decimal H, int Orden)>();
        var vistos = new HashSet<EstadoRecortes>();
        var orden = 0;

        void Agregar(EstadoRecortes estado)
        {
            var h = problema.Heuristica(estado);
            frontera.Enqueue(estado, (problema.Costo(estado) + h, h, orden++));
        }

        var inicial = problema.EstadoInicial;
        vistos.Add(inicial);
        Agregar(inicial);

        EstadoRecortes? solucion = null;

        while (frontera.Count > 0)
        {
            var estado = frontera.Dequeue();
            var cumpleMeta = problema.EsMeta(estado);
            traza.Add(new EstadoExplorado(
                traza.Count + 1,
                estado,
                problema.Recortado(estado),
                problema.Costo(estado),
                problema.Heuristica(estado),
                cumpleMeta));

            if (cumpleMeta)
            {
                solucion = estado;
                break;
            }

            foreach (var sucesor in problema.Sucesores(estado))
            {
                if (vistos.Add(sucesor))
                    Agregar(sucesor);
            }
        }

        cronometro.Stop();
        return new ResultadoBusqueda(
            Nombre,
            solucion,
            solucion is null ? null : problema.Costo(solucion),
            traza.Count,
            vistos.Count,
            cronometro.Elapsed,
            traza);
    }
}
