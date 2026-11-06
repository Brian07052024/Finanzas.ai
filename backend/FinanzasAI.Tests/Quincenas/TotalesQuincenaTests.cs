using FinanzasAI.Domain.Movimientos;
using FinanzasAI.Domain.Quincenas;

namespace FinanzasAI.Tests.Quincenas;

public class TotalesQuincenaTests
{
    private static readonly DateOnly Fecha = new(2026, 11, 4);

    private static Movimiento Ingreso(decimal monto) =>
        new(TipoMovimiento.Ingreso, monto, Fecha, null, null);

    private static Movimiento Gasto(decimal monto) =>
        new(TipoMovimiento.Gasto, monto, Fecha, Categoria.Otros, null);

    [Fact]
    public void SinMovimientos_TodoEnCero()
    {
        var totales = TotalesQuincena.Calcular([]);

        Assert.Equal(0m, totales.TotalIngresos);
        Assert.Equal(0m, totales.TotalGastos);
        Assert.Equal(0m, totales.Balance);
    }

    [Fact]
    public void SoloIngresos_SumaIngresosYGastosEnCero()
    {
        var totales = TotalesQuincena.Calcular([Ingreso(8000m), Ingreso(500.25m)]);

        Assert.Equal(8500.25m, totales.TotalIngresos);
        Assert.Equal(0m, totales.TotalGastos);
        Assert.Equal(8500.25m, totales.Balance);
    }

    [Fact]
    public void IngresosYGastos_BalanceEsLaDiferencia()
    {
        var totales = TotalesQuincena.Calcular([Ingreso(8000m), Gasto(1200.10m), Gasto(0.20m)]);

        Assert.Equal(8000m, totales.TotalIngresos);
        Assert.Equal(1200.30m, totales.TotalGastos);
        Assert.Equal(6799.70m, totales.Balance);
    }

    [Fact]
    public void GastosMayoresQueIngresos_BalanceNegativo()
    {
        var totales = TotalesQuincena.Calcular([Ingreso(1000m), Gasto(1500m)]);

        Assert.Equal(-500m, totales.Balance);
    }
}
