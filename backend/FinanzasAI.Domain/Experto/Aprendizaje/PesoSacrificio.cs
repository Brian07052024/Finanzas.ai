using FinanzasAI.Domain.Movimientos;

namespace FinanzasAI.Domain.Experto.Aprendizaje;

/// <summary>
/// Lo que el sistema aprende del usuario: cuánto le cuesta recortar cada categoría de deseos.
///
/// Simulación de aprendizaje por refuerzo negativo: cada vez que el usuario rechaza el recorte de
/// una categoría, su peso se multiplica por FactorRechazo. El siguiente plan ve esa categoría más
/// cara y la búsqueda tiende a recortar otras. Los valores no son reglas financieras sino
/// parámetros de diseño de la simulación (ver docs/motor-experto.md).
/// </summary>
public class PesoSacrificio
{
    /// <summary>Sin información del usuario, recortar un peso cuesta lo mismo en cualquier categoría.</summary>
    public const decimal PesoInicial = 1m;

    /// <summary>Cada rechazo duplica el costo de recortar esa categoría.</summary>
    public const decimal FactorRechazo = 2m;

    public Categoria Categoria { get; private set; }
    public decimal Peso { get; private set; }
    public int Rechazos { get; private set; }

    public PesoSacrificio(Categoria categoria)
    {
        if (!Enum.IsDefined(categoria))
            throw new ArgumentException("La categoría no es válida.");

        if (BaseConocimiento.EsNecesidad(categoria))
            throw new ArgumentException("Las necesidades no se recortan, así que no tienen peso de sacrificio.");

        Categoria = categoria;
        Peso = PesoInicial;
    }

    public void RegistrarRechazo()
    {
        Peso *= FactorRechazo;
        Rechazos++;
    }

    // Requerido para materializar desde la base de datos.
    private PesoSacrificio()
    {
    }
}
