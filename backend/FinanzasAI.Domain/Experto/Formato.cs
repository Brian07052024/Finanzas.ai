using System.Globalization;

namespace FinanzasAI.Domain.Experto;

/// <summary>Formato de los textos de explicación que el sistema experto le muestra al usuario.</summary>
internal static class Formato
{
    private static readonly CultureInfo Mexico = CultureInfo.GetCultureInfo("es-MX");

    public static string Moneda(decimal monto) => monto.ToString("C2", Mexico);

    public static string Porcentaje(decimal porcentaje) => porcentaje.ToString("0.0", Mexico) + "%";
}
