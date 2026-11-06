namespace FinanzasAI.Domain.Experto.Flujo;

/// <summary>
/// Arista dirigida con capacidad y flujo. Cada arista original tiene una arista inversa
/// (capacidad 0) para representar la red residual: la inversa permite "devolver" flujo.
/// </summary>
public sealed class Arista
{
    public int Desde { get; }
    public int Hacia { get; }
    public decimal Capacidad { get; }
    public decimal Flujo { get; internal set; }
    public bool EsOriginal { get; }

    internal Arista(int desde, int hacia, decimal capacidad, bool esOriginal)
    {
        Desde = desde;
        Hacia = hacia;
        Capacidad = capacidad;
        EsOriginal = esOriginal;
    }

    /// <summary>Cuánto flujo más admite la arista en la red residual.</summary>
    public decimal Residual => Capacidad - Flujo;
}

/// <summary>
/// Red de flujo con listas de adyacencia. Las aristas se guardan en pares: la arista original
/// en un índice par y su inversa en el siguiente (índice ^ 1), así encontrar la pareja es O(1).
/// </summary>
public sealed class RedFlujo
{
    private readonly List<string> _nombres = [];
    private readonly List<Arista> _aristas = [];
    private readonly List<List<int>> _adyacencia = [];

    public IReadOnlyList<string> Nombres => _nombres;
    public int CantidadNodos => _nombres.Count;

    /// <summary>Solo las aristas originales, sin las inversas de la red residual.</summary>
    public IEnumerable<Arista> Aristas => _aristas.Where(a => a.EsOriginal);

    public int AgregarNodo(string nombre)
    {
        _nombres.Add(nombre);
        _adyacencia.Add([]);
        return _nombres.Count - 1;
    }

    public Arista AgregarArista(int desde, int hacia, decimal capacidad)
    {
        if (capacidad < 0)
            throw new ArgumentException("La capacidad no puede ser negativa.");

        var original = new Arista(desde, hacia, capacidad, esOriginal: true);
        var inversa = new Arista(hacia, desde, 0, esOriginal: false);

        _adyacencia[desde].Add(_aristas.Count);
        _aristas.Add(original);
        _adyacencia[hacia].Add(_aristas.Count);
        _aristas.Add(inversa);

        return original;
    }

    internal IReadOnlyList<int> IndicesSalientes(int nodo) => _adyacencia[nodo];

    internal Arista ObtenerArista(int indice) => _aristas[indice];

    /// <summary>Empuja flujo por una arista y lo descuenta de su inversa.</summary>
    internal void Empujar(int indice, decimal cantidad)
    {
        _aristas[indice].Flujo += cantidad;
        _aristas[indice ^ 1].Flujo -= cantidad;
    }
}
