using System.ComponentModel.DataAnnotations;
using FinanzasAI.Api.Data;
using FinanzasAI.Api.Movimientos;
using FinanzasAI.Domain.Experto;
using FinanzasAI.Domain.Experto.Aprendizaje;
using FinanzasAI.Domain.Experto.Busqueda;
using FinanzasAI.Domain.Movimientos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinanzasAI.Api.Experto;

[ApiController]
[Route("api/plan")]
public class PlanController : ControllerBase
{
    /// <summary>La traza completa puede tener miles de estados; la interfaz solo muestra los primeros.</summary>
    private const int MaximoEstadosEnTraza = 200;

    private readonly FinanzasDbContext _db;

    public PlanController(FinanzasDbContext db)
    {
        _db = db;
    }

    /// <summary>Corre la búsqueda exhaustiva y la heurística sobre la quincena actual y las compara.</summary>
    [HttpGet]
    public async Task<PlanResponse> Obtener(CancellationToken cancellationToken)
    {
        var quincena = ConsultasMovimientos.QuincenaActual();
        var hechos = HechosQuincena.Desde(await _db.MovimientosDeAsync(quincena, cancellationToken));
        var configuracion = await ObtenerConfiguracionAsync(cancellationToken);
        var pesos = await _db.PesosSacrificio.AsNoTracking()
            .ToDictionaryAsync(p => p.Categoria, p => p.Peso, cancellationToken);

        var problema = ProblemaRecortes.Crear(hechos, configuracion.FraccionMeta, pesos);
        var exhaustiva = BusquedaExhaustiva.Ejecutar(problema);
        var heuristica = BusquedaAEstrella.Ejecutar(problema);

        return new PlanResponse(
            quincena.Inicio,
            quincena.Fin,
            configuracion.PorcentajeMeta,
            problema.Meta,
            problema.AhorroActual,
            Math.Max(0, problema.Meta - problema.AhorroActual),
            problema.EsAlcanzable,
            problema.AhorroActual + problema.Recortado(problema.EstadoMaximo),
            problema.TotalEstados,
            problema.Categorias.Select(c => new CategoriaRecortableResponse(c.Categoria, c.Gasto, c.Peso)).ToList(),
            [MapearResultado(problema, exhaustiva), MapearResultado(problema, heuristica)]);
    }

    [HttpGet("meta")]
    public async Task<MetaResponse> ObtenerMeta(CancellationToken cancellationToken) =>
        new((await ObtenerConfiguracionAsync(cancellationToken)).PorcentajeMeta);

    [HttpPut("meta")]
    [ProducesResponseType<MetaResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CambiarMeta(CambiarMetaRequest request, CancellationToken cancellationToken)
    {
        var configuracion = await _db.ConfiguracionesAhorro.FindAsync([ConfiguracionAhorro.IdUnico], cancellationToken);
        if (configuracion is null)
        {
            configuracion = new ConfiguracionAhorro();
            _db.ConfiguracionesAhorro.Add(configuracion);
        }

        try
        {
            configuracion.CambiarMeta(request.PorcentajeMeta!.Value);
        }
        catch (ArgumentException ex)
        {
            ModelState.AddModelError(string.Empty, ex.Message);
            return ValidationProblem(ModelState);
        }

        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new MetaResponse(configuracion.PorcentajeMeta));
    }

    /// <summary>Pesos de sacrificio aprendidos para cada categoría de deseos (1 si nunca se ha rechazado).</summary>
    [HttpGet("pesos")]
    public async Task<IReadOnlyList<PesoResponse>> ObtenerPesos(CancellationToken cancellationToken)
    {
        var guardados = await _db.PesosSacrificio.AsNoTracking()
            .ToDictionaryAsync(p => p.Categoria, cancellationToken);

        return Enum.GetValues<Categoria>()
            .Where(c => !BaseConocimiento.EsNecesidad(c))
            .Select(c => guardados.TryGetValue(c, out var p)
                ? new PesoResponse(c, p.Peso, p.Rechazos)
                : new PesoResponse(c, PesoSacrificio.PesoInicial, 0))
            .ToList();
    }

    /// <summary>Aprendizaje: el usuario rechaza recortar una categoría y su peso de sacrificio sube.</summary>
    [HttpPost("rechazos")]
    [ProducesResponseType<IReadOnlyList<PesoResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Rechazar(RechazoRequest request, CancellationToken cancellationToken)
    {
        var categoria = request.Categoria!.Value;
        var peso = await _db.PesosSacrificio.FindAsync([categoria], cancellationToken);
        if (peso is null)
        {
            try
            {
                peso = new PesoSacrificio(categoria);
            }
            catch (ArgumentException ex)
            {
                ModelState.AddModelError(string.Empty, ex.Message);
                return ValidationProblem(ModelState);
            }

            _db.PesosSacrificio.Add(peso);
        }

        peso.RegistrarRechazo();
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(await ObtenerPesos(cancellationToken));
    }

    /// <summary>Olvida lo aprendido: todos los pesos vuelven a 1.</summary>
    [HttpDelete("pesos")]
    public async Task<IActionResult> ReiniciarPesos(CancellationToken cancellationToken)
    {
        await _db.PesosSacrificio.ExecuteDeleteAsync(cancellationToken);
        return NoContent();
    }

    private async Task<ConfiguracionAhorro> ObtenerConfiguracionAsync(CancellationToken cancellationToken) =>
        await _db.ConfiguracionesAhorro.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == ConfiguracionAhorro.IdUnico, cancellationToken)
        ?? new ConfiguracionAhorro();

    private static ResultadoBusquedaResponse MapearResultado(ProblemaRecortes problema, ResultadoBusqueda resultado) =>
        new(
            resultado.Algoritmo,
            resultado.Solucion is null ? null : problema.ConstruirPlan(resultado.Solucion),
            resultado.Costo,
            resultado.EstadosExplorados,
            resultado.EstadosGenerados,
            resultado.Tiempo.TotalMilliseconds,
            resultado.Traza
                .Take(MaximoEstadosEnTraza)
                .Select(e => new EstadoExploradoResponse(
                    e.Orden, Describir(problema, e.Estado), e.Recortado, e.Costo, e.Heuristica, e.CumpleMeta))
                .ToList(),
            resultado.Traza.Count > MaximoEstadosEnTraza);

    private static string Describir(ProblemaRecortes problema, EstadoRecortes estado)
    {
        var partes = problema.Categorias
            .Select((c, i) => (c.Categoria, Porcentaje: BaseConocimiento.NivelesRecortePorcentaje[estado.Niveles[i]]))
            .Where(p => p.Porcentaje > 0)
            .Select(p => $"{p.Categoria} {p.Porcentaje}%")
            .ToList();

        return partes.Count == 0 ? "Sin recortes" : string.Join(", ", partes);
    }
}

public record CambiarMetaRequest([Required] int? PorcentajeMeta);

public record MetaResponse(int PorcentajeMeta);

public record RechazoRequest([Required] Categoria? Categoria);

public record PesoResponse(Categoria Categoria, decimal Peso, int Rechazos);

public record CategoriaRecortableResponse(Categoria Categoria, decimal Gasto, decimal Peso);

public record EstadoExploradoResponse(
    int Orden,
    string Descripcion,
    decimal Recortado,
    decimal Costo,
    decimal? Heuristica,
    bool CumpleMeta);

public record ResultadoBusquedaResponse(
    string Algoritmo,
    PlanRecortes? Plan,
    decimal? Sacrificio,
    int EstadosExplorados,
    int EstadosGenerados,
    double TiempoMs,
    IReadOnlyList<EstadoExploradoResponse> Traza,
    bool TrazaTruncada);

public record PlanResponse(
    DateOnly Inicio,
    DateOnly Fin,
    int PorcentajeMeta,
    decimal Meta,
    decimal AhorroActual,
    decimal Faltante,
    bool Alcanzable,
    decimal AhorroMaximoPosible,
    int TotalEstados,
    IReadOnlyList<CategoriaRecortableResponse> Categorias,
    IReadOnlyList<ResultadoBusquedaResponse> Busquedas);
