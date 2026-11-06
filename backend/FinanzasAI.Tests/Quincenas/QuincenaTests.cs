using FinanzasAI.Domain.Quincenas;

namespace FinanzasAI.Tests.Quincenas;

public class QuincenaTests
{
    [Theory]
    // Día 1 y día 14: quincena B que empezó el último día del mes anterior.
    [InlineData("2026-11-01", "2026-10-31", "2026-11-14")]
    [InlineData("2026-11-14", "2026-10-31", "2026-11-14")]
    // Día 15 y penúltimo día: quincena A.
    [InlineData("2026-11-15", "2026-11-15", "2026-11-29")]
    [InlineData("2026-11-29", "2026-11-15", "2026-11-29")]
    // Último día: empieza la quincena B.
    [InlineData("2026-11-30", "2026-11-30", "2026-12-14")]
    // Febrero de año normal.
    [InlineData("2027-02-27", "2027-02-15", "2027-02-27")]
    [InlineData("2027-02-28", "2027-02-28", "2027-03-14")]
    [InlineData("2027-03-01", "2027-02-28", "2027-03-14")]
    // Febrero de año bisiesto.
    [InlineData("2028-02-28", "2028-02-15", "2028-02-28")]
    [InlineData("2028-02-29", "2028-02-29", "2028-03-14")]
    // Cambio de año.
    [InlineData("2026-12-31", "2026-12-31", "2027-01-14")]
    [InlineData("2027-01-05", "2026-12-31", "2027-01-14")]
    public void QueContiene_DevuelveLaQuincenaSegunLosDiasDePago(string fecha, string inicio, string fin)
    {
        var quincena = Quincena.QueContiene(DateOnly.Parse(fecha));

        Assert.Equal(DateOnly.Parse(inicio), quincena.Inicio);
        Assert.Equal(DateOnly.Parse(fin), quincena.Fin);
    }
}
