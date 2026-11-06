using FinanzasAI.Api.Data;
using FinanzasAI.Api.Movimientos;
using FinanzasAI.Domain.Experto;
using FinanzasAI.Domain.Experto.Flujo;
using FinanzasAI.Domain.Movimientos;
using Microsoft.AspNetCore.Mvc;

namespace FinanzasAI.Api.Experto;

[ApiController]
[Route("api/flujo")]
public class FlujoController : ControllerBase
{
    private readonly FinanzasDbContext _db;

    public FlujoController(FinanzasDbContext db)
    {
        _db = db;
    }

    /// <summary>Flujo máximo y corte mínimo de la distribución del ingreso de la quincena actual.</summary>
    [HttpGet]
    public async Task<FlujoResponse> Obtener(CancellationToken cancellationToken)
    {
        var quincena = ConsultasMovimientos.QuincenaActual();
        var hechos = HechosQuincena.Desde(await _db.MovimientosDeAsync(quincena, cancellationToken));
        var distribucion = ModeloDistribucionIngreso.Calcular(hechos);
        var red = distribucion.Red;
        var corte = distribucion.Resultado.Corte.ToHashSet();

        return new FlujoResponse(
            quincena.Inicio,
            quincena.Fin,
            distribucion.Ingresos,
            distribucion.DemandaTotal,
            distribucion.FlujoMaximo,
            distribucion.CapacidadCorte,
            distribucion.IngresoSinAsignar,
            distribucion.DemandaSinCubrir,
            distribucion.Sobres,
            distribucion.Categorias
                .Select(c => new CategoriaFlujoResponse(c.Categoria, c.EsNecesidad, c.Gasto, c.Asignado, c.SinCubrir))
                .ToList(),
            distribucion.Resultado.Caminos
                .Select(c => new CaminoResponse(c.Numero, c.Nodos.Select(n => red.Nombres[n]).ToList(), c.Cuello))
                .ToList(),
            distribucion.Corte,
            red.Aristas
                .Select(a => new AristaResponse(
                    red.Nombres[a.Desde], red.Nombres[a.Hacia], a.Capacidad, a.Flujo, corte.Contains(a)))
                .ToList());
    }
}

public record CategoriaFlujoResponse(
    Categoria Categoria,
    bool EsNecesidad,
    decimal Gasto,
    decimal Asignado,
    decimal SinCubrir);

public record CaminoResponse(int Numero, IReadOnlyList<string> Nodos, decimal Cuello);

public record AristaResponse(string Desde, string Hacia, decimal Capacidad, decimal Flujo, bool EnCorte);

public record FlujoResponse(
    DateOnly Inicio,
    DateOnly Fin,
    decimal Ingresos,
    decimal DemandaTotal,
    decimal FlujoMaximo,
    decimal CapacidadCorte,
    decimal IngresoSinAsignar,
    decimal DemandaSinCubrir,
    IReadOnlyList<SobrePresupuesto> Sobres,
    IReadOnlyList<CategoriaFlujoResponse> Categorias,
    IReadOnlyList<CaminoResponse> Caminos,
    IReadOnlyList<AristaCorte> Corte,
    IReadOnlyList<AristaResponse> Aristas);
