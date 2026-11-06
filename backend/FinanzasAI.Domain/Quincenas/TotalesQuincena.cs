using FinanzasAI.Domain.Movimientos;

namespace FinanzasAI.Domain.Quincenas;

public readonly record struct TotalesQuincena(decimal TotalIngresos, decimal TotalGastos)
{
    public decimal Balance => TotalIngresos - TotalGastos;

    public static TotalesQuincena Calcular(IEnumerable<Movimiento> movimientos)
    {
        decimal ingresos = 0;
        decimal gastos = 0;

        foreach (var movimiento in movimientos)
        {
            if (movimiento.Tipo == TipoMovimiento.Ingreso)
                ingresos += movimiento.Monto;
            else
                gastos += movimiento.Monto;
        }

        return new TotalesQuincena(ingresos, gastos);
    }
}
