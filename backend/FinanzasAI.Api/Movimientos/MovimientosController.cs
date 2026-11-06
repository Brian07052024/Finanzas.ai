using FinanzasAI.Api.Data;
using FinanzasAI.Domain.Movimientos;
using FinanzasAI.Domain.Quincenas;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanzasAI.Api.Movimientos;

[ApiController]
[Route("api/movimientos")]
public class MovimientosController : ControllerBase
{
    private readonly FinanzasDbContext _db;

    public MovimientosController(FinanzasDbContext db)
    {
        _db = db;
    }

    [HttpPost]
    [ProducesResponseType<MovimientoResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Crear(CrearMovimientoRequest request, CancellationToken cancellationToken)
    {
        Movimiento movimiento;
        try
        {
            // [Required] ya garantiza que Tipo, Monto y Fecha no son null.
            movimiento = new Movimiento(
                request.Tipo!.Value,
                request.Monto!.Value,
                request.Fecha!.Value,
                request.Categoria,
                request.Descripcion);
        }
        catch (ArgumentException ex)
        {
            ModelState.AddModelError(string.Empty, ex.Message);
            return ValidationProblem(ModelState);
        }

        _db.Movimientos.Add(movimiento);
        await _db.SaveChangesAsync(cancellationToken);

        return StatusCode(StatusCodes.Status201Created, MovimientoResponse.Desde(movimiento));
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Borrar(int id, CancellationToken cancellationToken)
    {
        var borrados = await _db.Movimientos
            .Where(m => m.Id == id)
            .ExecuteDeleteAsync(cancellationToken);

        return borrados == 0 ? NotFound() : NoContent();
    }

    [HttpGet("quincena-actual")]
    public async Task<QuincenaActualResponse> QuincenaActual(CancellationToken cancellationToken)
    {
        var quincena = ConsultasMovimientos.QuincenaActual();
        var movimientos = await _db.MovimientosDeAsync(quincena, cancellationToken);

        var totales = TotalesQuincena.Calcular(movimientos);

        return new QuincenaActualResponse(
            quincena.Inicio,
            quincena.Fin,
            totales.TotalIngresos,
            totales.TotalGastos,
            totales.Balance,
            movimientos.Select(MovimientoResponse.Desde).ToList());
    }
}
