using FinanzasAI.Domain.Movimientos;

namespace FinanzasAI.Domain.Experto.Busqueda;

/// <summary>Una categoría de deseos que el plan puede recortar.</summary>
public record CategoriaRecortable(Categoria Categoria, decimal Gasto, decimal Peso);

/// <summary>
/// Definición formal del problema de búsqueda del plan de recortes.
///
/// - Estado: nivel de recorte (0%, 25%, 50% o 75%) de cada categoría de deseos con gasto.
/// - Estado inicial: ningún recorte.
/// - Acción (sucesor): subir un nivel el recorte de una sola categoría.
/// - Prueba de meta: ahorro actual + total recortado >= meta de ahorro.
/// - Costo (sacrificio): suma de peso de la categoría * monto recortado. El peso empieza en 1
///   (un peso recortado cuesta lo mismo en cualquier categoría) y crece con el aprendizaje.
///
/// Las necesidades no aparecen como categorías recortables (R1) y ningún nivel pasa de 75% (R3).
/// </summary>
public sealed class ProblemaRecortes
{
    public IReadOnlyList<CategoriaRecortable> Categorias { get; }
    public decimal AhorroActual { get; }
    public decimal Meta { get; }

    private readonly decimal _pesoMinimo;
    private static int NivelMaximo => BaseConocimiento.NivelesRecortePorcentaje.Count - 1;

    public ProblemaRecortes(IReadOnlyList<CategoriaRecortable> categorias, decimal ahorroActual, decimal meta)
    {
        Categorias = categorias;
        AhorroActual = ahorroActual;
        Meta = meta;
        _pesoMinimo = categorias.Count == 0 ? 0 : categorias.Min(c => c.Peso);
    }

    /// <summary>
    /// Arma el problema a partir de los hechos: solo entran los deseos con gasto mayor que cero,
    /// en el orden del enum para que la búsqueda sea determinista.
    /// </summary>
    public static ProblemaRecortes Crear(
        HechosQuincena hechos,
        decimal fraccionMeta,
        IReadOnlyDictionary<Categoria, decimal> pesos)
    {
        var categorias = hechos.GastosPorCategoria
            .Where(g => !BaseConocimiento.EsNecesidad(g.Key) && g.Value > 0)
            .OrderBy(g => g.Key)
            .Select(g => new CategoriaRecortable(g.Key, g.Value, pesos.GetValueOrDefault(g.Key, 1m)))
            .ToList();

        var meta = decimal.Round(hechos.Ingresos * fraccionMeta, 2);
        return new ProblemaRecortes(categorias, hechos.Ahorro, meta);
    }

    public EstadoRecortes EstadoInicial => new(new int[Categorias.Count]);

    public EstadoRecortes EstadoMaximo => new(Enumerable.Repeat(NivelMaximo, Categorias.Count));

    public int TotalEstados => (int)Math.Pow(BaseConocimiento.NivelesRecortePorcentaje.Count, Categorias.Count);

    public decimal MontoRecorte(int indiceCategoria, int nivel) =>
        decimal.Round(
            Categorias[indiceCategoria].Gasto * BaseConocimiento.NivelesRecortePorcentaje[nivel] / 100m,
            2,
            MidpointRounding.AwayFromZero);

    public decimal Recortado(EstadoRecortes estado)
    {
        decimal total = 0;
        for (var i = 0; i < Categorias.Count; i++)
            total += MontoRecorte(i, estado.Niveles[i]);
        return total;
    }

    /// <summary>Costo del estado (sacrificio). Depende solo del estado, no del camino para llegar a él.</summary>
    public decimal Costo(EstadoRecortes estado)
    {
        decimal total = 0;
        for (var i = 0; i < Categorias.Count; i++)
            total += Categorias[i].Peso * MontoRecorte(i, estado.Niveles[i]);
        return total;
    }

    public bool EsMeta(EstadoRecortes estado) => AhorroActual + Recortado(estado) >= Meta;

    /// <summary>¿Existe algún plan que alcance la meta? Basta revisar el recorte máximo en todo.</summary>
    public bool EsAlcanzable => EsMeta(EstadoMaximo);

    public IEnumerable<EstadoRecortes> Sucesores(EstadoRecortes estado)
    {
        for (var i = 0; i < Categorias.Count; i++)
        {
            if (estado.Niveles[i] < NivelMaximo)
                yield return estado.ConNivel(i, estado.Niveles[i] + 1);
        }
    }

    /// <summary>
    /// Heurística de A*: lo que falta para la meta multiplicado por el peso más bajo.
    /// Es admisible porque cada peso recortado cuesta al menos el peso mínimo, así que nunca
    /// sobreestima el sacrificio restante. También es consistente: al subir un nivel en la
    /// categoría i se recorta D, el costo sube peso_i * D y la heurística baja como mucho
    /// pesoMinimo * D, que es menor o igual.
    /// </summary>
    public decimal Heuristica(EstadoRecortes estado)
    {
        var faltante = Meta - AhorroActual - Recortado(estado);
        return faltante <= 0 ? 0 : faltante * _pesoMinimo;
    }

    public PlanRecortes ConstruirPlan(EstadoRecortes estado)
    {
        var recortes = new List<RecortePlan>();
        for (var i = 0; i < Categorias.Count; i++)
        {
            var nivel = estado.Niveles[i];
            if (nivel == 0)
                continue;

            var categoria = Categorias[i];
            var monto = MontoRecorte(i, nivel);
            recortes.Add(new RecortePlan(
                categoria.Categoria,
                categoria.Gasto,
                BaseConocimiento.NivelesRecortePorcentaje[nivel],
                monto,
                categoria.Peso,
                categoria.Peso * monto));
        }

        // Ordenamiento: los recortes más grandes primero.
        recortes.Sort((a, b) => b.MontoRecortado.CompareTo(a.MontoRecortado));

        var recortado = Recortado(estado);
        return new PlanRecortes(
            recortes,
            recortado,
            Costo(estado),
            AhorroActual + recortado,
            Meta,
            EsMeta(estado));
    }
}

public record RecortePlan(
    Categoria Categoria,
    decimal GastoActual,
    int Porcentaje,
    decimal MontoRecortado,
    decimal Peso,
    decimal Sacrificio);

public record PlanRecortes(
    IReadOnlyList<RecortePlan> Recortes,
    decimal TotalRecortado,
    decimal Sacrificio,
    decimal AhorroResultante,
    decimal Meta,
    bool CumpleMeta);
