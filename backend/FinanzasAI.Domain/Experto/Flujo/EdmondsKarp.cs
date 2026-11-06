namespace FinanzasAI.Domain.Experto.Flujo;

/// <summary>Un camino de la fuente al sumidero en la red residual y cuánto flujo se empujó por él.</summary>
public record CaminoAumentante(int Numero, IReadOnlyList<int> Nodos, decimal Cuello);

/// <summary>
/// Resultado del flujo máximo.
/// LadoSumidero: nodos desde los que todavía se puede llegar al sumidero en la red residual final.
/// Corte: aristas originales que entran al lado del sumidero desde el resto de la red.
/// Por el teorema de flujo máximo y corte mínimo, FlujoMaximo == CapacidadCorte.
/// </summary>
public record ResultadoFlujo(
    decimal FlujoMaximo,
    IReadOnlyList<CaminoAumentante> Caminos,
    IReadOnlySet<int> LadoSumidero,
    IReadOnlyList<Arista> Corte)
{
    public decimal CapacidadCorte => Corte.Sum(a => a.Capacidad);
}

/// <summary>
/// Flujo máximo con Edmonds-Karp: el método de Ford-Fulkerson usando BFS para buscar cada
/// camino aumentante.
///
/// 1. Buscar con BFS un camino de la fuente al sumidero usando solo aristas con capacidad residual.
/// 2. El cuello de botella del camino es su menor capacidad residual; se empuja esa cantidad.
/// 3. Repetir hasta que no exista camino. Ese flujo es máximo.
///
/// Usar BFS (el camino con menos aristas) garantiza terminar en O(V * E^2) sin importar
/// las capacidades; Ford-Fulkerson con DFS podría tardar según los valores de las capacidades.
///
/// Al terminar se obtiene un corte mínimo: sus aristas están saturadas y su capacidad total es
/// igual al flujo máximo (teorema de flujo máximo y corte mínimo). Puede haber varios cortes
/// mínimos; se toma el más cercano al sumidero (los nodos que todavía llegan al sumidero en la red
/// residual) porque señala el límite más específico. Por ejemplo, si los topes 50/30/20 suman todo el
/// ingreso, el corte junto a la fuente solo diría "el ingreso no alcanza", mientras que el cercano
/// al sumidero dice qué topes están llenos.
///
/// Modifica los flujos de la red recibida.
/// </summary>
public static class EdmondsKarp
{
    public static ResultadoFlujo Ejecutar(RedFlujo red, int fuente, int sumidero)
    {
        var caminos = new List<CaminoAumentante>();
        decimal flujoMaximo = 0;

        while (true)
        {
            var aristaPadre = BuscarCamino(red, fuente, sumidero);
            if (aristaPadre is null)
                break;

            // Reconstruir el camino desde el sumidero y encontrar el cuello de botella.
            var indices = new List<int>();
            for (var nodo = sumidero; nodo != fuente; nodo = red.ObtenerArista(aristaPadre[nodo]).Desde)
                indices.Add(aristaPadre[nodo]);
            indices.Reverse();

            var cuello = indices.Min(i => red.ObtenerArista(i).Residual);
            foreach (var indice in indices)
                red.Empujar(indice, cuello);

            flujoMaximo += cuello;
            var nodos = indices.Select(i => red.ObtenerArista(i).Desde).Append(sumidero).ToList();
            caminos.Add(new CaminoAumentante(caminos.Count + 1, nodos, cuello));
        }

        var ladoSumidero = LleganAlSumidero(red, sumidero);
        var corte = red.Aristas
            .Where(a => !ladoSumidero.Contains(a.Desde) && ladoSumidero.Contains(a.Hacia))
            .ToList();

        return new ResultadoFlujo(flujoMaximo, caminos, ladoSumidero, corte);
    }

    /// <summary>
    /// BFS en la red residual. Devuelve, para cada nodo alcanzado, el índice de la arista por la que
    /// se llegó, o null si el sumidero no es alcanzable.
    /// </summary>
    private static int[]? BuscarCamino(RedFlujo red, int fuente, int sumidero)
    {
        var aristaPadre = Enumerable.Repeat(-1, red.CantidadNodos).ToArray();
        var visitado = new bool[red.CantidadNodos];
        var cola = new Queue<int>();
        visitado[fuente] = true;
        cola.Enqueue(fuente);

        while (cola.Count > 0)
        {
            var nodo = cola.Dequeue();
            foreach (var indice in red.IndicesSalientes(nodo))
            {
                var arista = red.ObtenerArista(indice);
                if (visitado[arista.Hacia] || arista.Residual <= 0)
                    continue;

                visitado[arista.Hacia] = true;
                aristaPadre[arista.Hacia] = indice;
                if (arista.Hacia == sumidero)
                    return aristaPadre;
                cola.Enqueue(arista.Hacia);
            }
        }

        return null;
    }

    /// <summary>
    /// BFS hacia atrás desde el sumidero: nodos que tienen un camino residual hasta él.
    /// Las aristas que entran a un nodo son las parejas (índice ^ 1) de las que salen de él.
    /// </summary>
    private static HashSet<int> LleganAlSumidero(RedFlujo red, int sumidero)
    {
        var llegan = new HashSet<int> { sumidero };
        var cola = new Queue<int>();
        cola.Enqueue(sumidero);

        while (cola.Count > 0)
        {
            var nodo = cola.Dequeue();
            foreach (var indice in red.IndicesSalientes(nodo))
            {
                var entrante = red.ObtenerArista(indice ^ 1);
                if (entrante.Residual > 0 && llegan.Add(entrante.Desde))
                    cola.Enqueue(entrante.Desde);
            }
        }

        return llegan;
    }
}
