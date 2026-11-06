using FinanzasAI.Domain.Experto;
using FinanzasAI.Domain.Movimientos;

namespace FinanzasAI.Tests.Experto;

public class HechosQuincenaTests
{
    private static readonly DateOnly Fecha = new(2026, 11, 5);

    [Fact]
    public void Desde_SumaIngresosYClasificaGastosEnNecesidadesYDeseos()
    {
        var hechos = HechosQuincena.Desde([
            new Movimiento(TipoMovimiento.Ingreso, 10000m, Fecha, null, null),
            new Movimiento(TipoMovimiento.Gasto, 3000m, Fecha, Categoria.Vivienda, null),
            new Movimiento(TipoMovimiento.Gasto, 1500m, Fecha, Categoria.Supermercado, null),
            new Movimiento(TipoMovimiento.Gasto, 800m, Fecha, Categoria.Restaurantes, null),
            new Movimiento(TipoMovimiento.Gasto, 200m, Fecha, Categoria.Restaurantes, null),
            new Movimiento(TipoMovimiento.Gasto, 300m, Fecha, Categoria.Suscripciones, null),
        ]);

        Assert.Equal(10000m, hechos.Ingresos);
        Assert.Equal(4500m, hechos.Necesidades);
        Assert.Equal(1300m, hechos.Deseos);
        Assert.Equal(4200m, hechos.Ahorro);
        Assert.Equal(1000m, hechos.GastosPorCategoria[Categoria.Restaurantes]);
    }

    [Fact]
    public void PorcentajeDelIngreso_SinIngresos_EsCero()
    {
        var hechos = new HechosQuincena(0m, new Dictionary<Categoria, decimal> { [Categoria.Ropa] = 100m });

        Assert.Equal(0m, hechos.PorcentajeDelIngreso(100m));
    }

    [Fact]
    public void TodasLasCategorias_EstanClasificadas()
    {
        foreach (var categoria in Enum.GetValues<Categoria>())
            BaseConocimiento.EsNecesidad(categoria);
    }
}
