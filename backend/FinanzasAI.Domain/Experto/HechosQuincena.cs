using FinanzasAI.Domain.Movimientos;

namespace FinanzasAI.Domain.Experto;

/// <summary>
/// Base de hechos: lo que el sistema experto sabe de la quincena, resumido a partir de los movimientos.
/// </summary>
public class HechosQuincena
{
    public decimal Ingresos { get; }
    public IReadOnlyDictionary<Categoria, decimal> GastosPorCategoria { get; }
    public decimal Necesidades { get; }
    public decimal Deseos { get; }
    public decimal Gastos => Necesidades + Deseos;
    public decimal Ahorro => Ingresos - Gastos;

    public HechosQuincena(decimal ingresos, IReadOnlyDictionary<Categoria, decimal> gastosPorCategoria)
    {
        Ingresos = ingresos;
        GastosPorCategoria = gastosPorCategoria;
        Necesidades = gastosPorCategoria.Where(g => BaseConocimiento.EsNecesidad(g.Key)).Sum(g => g.Value);
        Deseos = gastosPorCategoria.Where(g => !BaseConocimiento.EsNecesidad(g.Key)).Sum(g => g.Value);
    }

    public static HechosQuincena Desde(IEnumerable<Movimiento> movimientos)
    {
        decimal ingresos = 0;
        var gastos = new Dictionary<Categoria, decimal>();

        foreach (var movimiento in movimientos)
        {
            if (movimiento.Tipo == TipoMovimiento.Ingreso)
            {
                ingresos += movimiento.Monto;
                continue;
            }

            var categoria = movimiento.Categoria!.Value;
            gastos[categoria] = gastos.GetValueOrDefault(categoria) + movimiento.Monto;
        }

        return new HechosQuincena(ingresos, gastos);
    }

    /// <summary>Porcentaje de un monto respecto al ingreso, redondeado a un decimal. Cero si no hay ingresos.</summary>
    public decimal PorcentajeDelIngreso(decimal monto) =>
        Ingresos == 0 ? 0 : decimal.Round(monto * 100 / Ingresos, 1);
}
