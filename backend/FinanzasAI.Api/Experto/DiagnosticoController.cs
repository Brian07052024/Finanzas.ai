using FinanzasAI.Api.Data;
using FinanzasAI.Api.Movimientos;
using FinanzasAI.Domain.Experto;
using FinanzasAI.Domain.Experto.Inferencia;
using FinanzasAI.Domain.Movimientos;
using Microsoft.AspNetCore.Mvc;

namespace FinanzasAI.Api.Experto;

[ApiController]
[Route("api/diagnostico")]
public class DiagnosticoController : ControllerBase
{
    private readonly FinanzasDbContext _db;

    public DiagnosticoController(FinanzasDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<DiagnosticoResponse> Obtener(CancellationToken cancellationToken)
    {
        var quincena = ConsultasMovimientos.QuincenaActual();
        var hechos = HechosQuincena.Desde(await _db.MovimientosDeAsync(quincena, cancellationToken));
        var resultado = ArbolDiagnostico.Diagnosticar(hechos);

        var idsEnCamino = resultado.Camino.Select(p => p.NodoId).Append(resultado.HojaId).ToHashSet();

        var arbol = ArbolDiagnostico.RecorrerPreorden()
            .Select(n => n.Nodo switch
            {
                NodoPregunta p => new NodoArbolResponse(
                    p.Id, p.Pregunta, n.Profundidad, n.RamaDesdePadre, false, p.Regla?.Codigo, idsEnCamino.Contains(p.Id)),
                NodoHoja h => new NodoArbolResponse(
                    h.Id, h.Diagnostico.Titulo, n.Profundidad, n.RamaDesdePadre, true, null, idsEnCamino.Contains(h.Id)),
                _ => throw new InvalidOperationException("Tipo de nodo desconocido.")
            })
            .ToList();

        return new DiagnosticoResponse(
            quincena.Inicio,
            quincena.Fin,
            new HechosResponse(
                hechos.Ingresos,
                hechos.Necesidades,
                hechos.Deseos,
                hechos.Ahorro,
                hechos.PorcentajeDelIngreso(hechos.Necesidades),
                hechos.PorcentajeDelIngreso(hechos.Deseos),
                hechos.PorcentajeDelIngreso(hechos.Ahorro),
                hechos.GastosPorCategoria
                    .OrderByDescending(g => g.Value)
                    .Select(g => new GastoCategoriaResponse(g.Key, BaseConocimiento.EsNecesidad(g.Key), g.Value))
                    .ToList()),
            new DiagnosticoHojaResponse(
                resultado.HojaId,
                resultado.Diagnostico.Codigo,
                resultado.Diagnostico.Titulo,
                resultado.Diagnostico.Descripcion,
                resultado.Diagnostico.RecomiendaPlan),
            resultado.Camino
                .Select(p => new PasoResponse(p.NodoId, p.Pregunta, p.Observado, p.Respuesta, p.Regla?.Codigo))
                .ToList(),
            arbol,
            BaseConocimiento.Reglas);
    }
}

public record HechosResponse(
    decimal Ingresos,
    decimal Necesidades,
    decimal Deseos,
    decimal Ahorro,
    decimal PorcentajeNecesidades,
    decimal PorcentajeDeseos,
    decimal PorcentajeAhorro,
    IReadOnlyList<GastoCategoriaResponse> GastosPorCategoria);

public record GastoCategoriaResponse(Categoria Categoria, bool EsNecesidad, decimal Monto);

public record DiagnosticoHojaResponse(
    string HojaId,
    string Codigo,
    string Titulo,
    string Descripcion,
    bool RecomiendaPlan);

public record PasoResponse(string NodoId, string Pregunta, string Observado, bool Respuesta, string? Regla);

public record NodoArbolResponse(
    string Id,
    string Texto,
    int Profundidad,
    bool? Rama,
    bool EsHoja,
    string? Regla,
    bool EnCamino);

public record DiagnosticoResponse(
    DateOnly Inicio,
    DateOnly Fin,
    HechosResponse Hechos,
    DiagnosticoHojaResponse Diagnostico,
    IReadOnlyList<PasoResponse> Camino,
    IReadOnlyList<NodoArbolResponse> Arbol,
    IReadOnlyList<Regla> Reglas);
