using System.ComponentModel.DataAnnotations;
using FinanzasAI.Domain.Movimientos;

namespace FinanzasAI.Api.Movimientos;

// Los campos obligatorios son anulables para que [Required] detecte cuando faltan en el JSON;
// de lo contrario un tipo de valor ausente llegaría con su valor por defecto.
public record CrearMovimientoRequest(
    [Required] TipoMovimiento? Tipo,
    [Required] decimal? Monto,
    [Required] DateOnly? Fecha,
    Categoria? Categoria,
    string? Descripcion);

public record MovimientoResponse(
    int Id,
    TipoMovimiento Tipo,
    decimal Monto,
    DateOnly Fecha,
    Categoria? Categoria,
    string? Descripcion)
{
    public static MovimientoResponse Desde(Movimiento movimiento) => new(
        movimiento.Id,
        movimiento.Tipo,
        movimiento.Monto,
        movimiento.Fecha,
        movimiento.Categoria,
        movimiento.Descripcion);
}

public record QuincenaActualResponse(
    DateOnly Inicio,
    DateOnly Fin,
    decimal TotalIngresos,
    decimal TotalGastos,
    decimal Balance,
    IReadOnlyList<MovimientoResponse> Movimientos);
