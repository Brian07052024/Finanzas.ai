using FinanzasAI.Api.Data;
using FinanzasAI.Domain.Movimientos;
using FinanzasAI.Domain.Quincenas;
using Microsoft.EntityFrameworkCore;

namespace FinanzasAI.Api.Movimientos;

public static class ConsultasMovimientos
{
    /// <summary>La quincena que contiene la fecha local del servidor.</summary>
    public static Quincena QuincenaActual() => Quincena.QueContiene(DateOnly.FromDateTime(DateTime.Now));

    /// <summary>Movimientos de la quincena, del más reciente al más antiguo.</summary>
    public static Task<List<Movimiento>> MovimientosDeAsync(
        this FinanzasDbContext db, Quincena quincena, CancellationToken cancellationToken) =>
        db.Movimientos
            .AsNoTracking()
            .Where(m => m.Fecha >= quincena.Inicio && m.Fecha <= quincena.Fin)
            .OrderByDescending(m => m.Fecha)
            .ThenByDescending(m => m.Id)
            .ToListAsync(cancellationToken);
}
