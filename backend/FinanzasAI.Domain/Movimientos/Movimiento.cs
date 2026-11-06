using System.Globalization;

namespace FinanzasAI.Domain.Movimientos;

/// <summary>
/// Un ingreso o un gasto en MXN. El constructor garantiza las invariantes,
/// así que una instancia de Movimiento siempre es válida.
/// </summary>
public class Movimiento
{
    public const int LargoMaximoDescripcion = 200;

    /// <summary>Máximo representable en numeric(12,2).</summary>
    public const decimal MontoMaximo = 9_999_999_999.99m;

    public int Id { get; private set; }
    public TipoMovimiento Tipo { get; private set; }
    public decimal Monto { get; private set; }
    public DateOnly Fecha { get; private set; }
    public Categoria? Categoria { get; private set; }
    public string? Descripcion { get; private set; }

    public Movimiento(
        TipoMovimiento tipo,
        decimal monto,
        DateOnly fecha,
        Categoria? categoria,
        string? descripcion)
    {
        if (!Enum.IsDefined(tipo))
            throw new ArgumentException("El tipo de movimiento no es válido.");

        if (monto <= 0)
            throw new ArgumentException("El monto debe ser mayor que cero.");

        if (decimal.Round(monto, 2) != monto)
            throw new ArgumentException("El monto admite como máximo dos decimales.");

        if (monto > MontoMaximo)
            throw new ArgumentException(
                $"El monto no puede ser mayor que {MontoMaximo.ToString("C2", CultureInfo.GetCultureInfo("es-MX"))}.");

        if (categoria is not null && !Enum.IsDefined(categoria.Value))
            throw new ArgumentException("La categoría no es válida.");

        if (tipo == TipoMovimiento.Gasto && categoria is null)
            throw new ArgumentException("Un gasto requiere categoría.");

        if (tipo == TipoMovimiento.Ingreso && categoria is not null)
            throw new ArgumentException("Un ingreso no lleva categoría.");

        var descripcionLimpia = string.IsNullOrWhiteSpace(descripcion) ? null : descripcion.Trim();

        if (descripcionLimpia is not null && descripcionLimpia.Length > LargoMaximoDescripcion)
            throw new ArgumentException($"La descripción admite como máximo {LargoMaximoDescripcion} caracteres.");

        Tipo = tipo;
        Monto = monto;
        Fecha = fecha;
        Categoria = categoria;
        Descripcion = descripcionLimpia;
    }

    // Requerido para materializar desde la base de datos.
    private Movimiento()
    {
    }
}
