namespace FinanzasAI.Domain.Quincenas;

/// <summary>
/// Periodo entre dos días de pago. Los días de pago son el 15 y el último día de cada mes
/// (ver docs/spec.md):
/// - Quincena A: del día 15 al día anterior al último día del mes.
/// - Quincena B: del último día del mes al día 14 del mes siguiente.
/// Inicio y Fin son inclusivos. Las quincenas no duran siempre lo mismo.
/// </summary>
public readonly record struct Quincena(DateOnly Inicio, DateOnly Fin)
{
    public static Quincena QueContiene(DateOnly fecha)
    {
        var ultimoDia = UltimoDiaDelMes(fecha);

        // Del 1 al 14: quincena B que empezó el último día del mes anterior.
        if (fecha.Day < 15)
        {
            var mesAnterior = fecha.AddMonths(-1);
            return new Quincena(UltimoDiaDelMes(mesAnterior), new DateOnly(fecha.Year, fecha.Month, 14));
        }

        // Último día del mes: empieza la quincena B, que termina el 14 del mes siguiente.
        if (fecha == ultimoDia)
        {
            var mesSiguiente = fecha.AddMonths(1);
            return new Quincena(ultimoDia, new DateOnly(mesSiguiente.Year, mesSiguiente.Month, 14));
        }

        // Del 15 al penúltimo día: quincena A.
        return new Quincena(new DateOnly(fecha.Year, fecha.Month, 15), ultimoDia.AddDays(-1));
    }

    private static DateOnly UltimoDiaDelMes(DateOnly fecha) =>
        new(fecha.Year, fecha.Month, DateTime.DaysInMonth(fecha.Year, fecha.Month));
}
