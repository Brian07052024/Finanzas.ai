using FinanzasAI.Domain.Movimientos;

namespace FinanzasAI.Domain.Experto;

/// <summary>
/// Base de conocimiento del sistema experto. Cada umbral numérico sale de una regla con fuente
/// documentada; los parámetros que no son reglas financieras (por ejemplo, los del aprendizaje)
/// están en sus propias clases y se explican en docs/motor-experto.md.
/// </summary>
public static class BaseConocimiento
{
    public static readonly Regla R1Regla503020 = new(
        "R1",
        "Regla 50/30/20: del ingreso, hasta 50% para necesidades, hasta 30% para deseos y al menos 20% para ahorro. " +
        "Comer fuera, entretenimiento y suscripciones se consideran deseos.",
        "Warren, E. y Warren Tyagi, A. (2005). All Your Worth: The Ultimate Lifetime Money Plan. Free Press.");

    public static readonly Regla R2AhorroMinimo = new(
        "R2",
        "Ahorrar al menos 10% del ingreso como punto de partida.",
        "CONDUSEF: hacer un presupuesto, recortar gastos y ahorrar al menos el 10% de los ingresos. " +
        "Citada en Expansión (4 de noviembre de 2021), \"Cómo pagar deudas según Condusef\".");

    public static readonly Regla R3RecortePaulatino = new(
        "R3",
        "Recortar los gastos prescindibles de forma paulatina, sin eliminarlos por completo.",
        "CONDUSEF, recomendaciones sobre gastos hormiga: recortar los gastos prescindibles y hacer el cambio de forma " +
        "paulatina. Citada en Expansión (18 de febrero de 2022), \"Eliminar gastos hormiga\".");

    public static readonly IReadOnlyList<Regla> Reglas = [R1Regla503020, R2AhorroMinimo, R3RecortePaulatino];

    /// <summary>R1: fracción del ingreso que se recomienda ahorrar (20%). Es la meta por defecto.</summary>
    public const decimal FraccionAhorroRecomendada = 0.20m;

    /// <summary>R1: fracción máxima del ingreso para deseos (30%).</summary>
    public const decimal FraccionMaximaDeseos = 0.30m;

    /// <summary>R1: fracción máxima del ingreso para necesidades (50%).</summary>
    public const decimal FraccionMaximaNecesidades = 0.50m;

    /// <summary>R2: fracción mínima del ingreso que conviene ahorrar (10%).</summary>
    public const decimal FraccionAhorroMinima = 0.10m;

    /// <summary>
    /// R3: niveles de recorte permitidos por categoría de deseos, en porcentaje de lo gastado.
    /// El tope de 75% deja siempre un mínimo de 25% de la categoría (recorte paulatino).
    /// </summary>
    public static readonly IReadOnlyList<int> NivelesRecortePorcentaje = [0, 25, 50, 75];

    /// <summary>
    /// R1: clasificación de las categorías. Las necesidades son esenciales y no se recortan;
    /// los deseos son las únicas categorías que el plan puede recortar.
    /// </summary>
    public static bool EsNecesidad(Categoria categoria) => categoria switch
    {
        Categoria.Vivienda => true,
        Categoria.Supermercado => true,
        Categoria.Transporte => true,
        Categoria.Servicios => true,
        Categoria.Salud => true,
        Categoria.Educacion => true,
        Categoria.Restaurantes => false,
        Categoria.Entretenimiento => false,
        Categoria.Ropa => false,
        Categoria.Suscripciones => false,
        Categoria.Otros => false,
        _ => throw new ArgumentOutOfRangeException(nameof(categoria), categoria, "Categoría no clasificada.")
    };
}
