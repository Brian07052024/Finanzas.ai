namespace FinanzasAI.Domain.Experto;

/// <summary>
/// Meta de ahorro de la quincena como porcentaje entero del ingreso.
/// Por defecto 20% (R1); el usuario puede cambiarla.
/// Hay un solo registro porque la app es de un solo usuario.
/// </summary>
public class ConfiguracionAhorro
{
    public const int IdUnico = 1;
    public const int PorcentajePorDefecto = 20;

    public int Id { get; private set; } = IdUnico;
    public int PorcentajeMeta { get; private set; } = PorcentajePorDefecto;

    public decimal FraccionMeta => PorcentajeMeta / 100m;

    public void CambiarMeta(int porcentaje)
    {
        if (porcentaje < 1 || porcentaje > 100)
            throw new ArgumentException("La meta de ahorro debe estar entre 1% y 100% del ingreso.");

        PorcentajeMeta = porcentaje;
    }
}
