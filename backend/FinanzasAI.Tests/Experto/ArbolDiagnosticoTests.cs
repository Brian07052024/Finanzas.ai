using FinanzasAI.Domain.Experto;
using FinanzasAI.Domain.Experto.Inferencia;
using FinanzasAI.Domain.Movimientos;

namespace FinanzasAI.Tests.Experto;

public class ArbolDiagnosticoTests
{
    // Necesidades en Supermercado y deseos en Restaurantes; basta para mover los porcentajes.
    private static HechosQuincena Hechos(decimal ingresos, decimal necesidades, decimal deseos) =>
        new(ingresos, new Dictionary<Categoria, decimal>
        {
            [Categoria.Supermercado] = necesidades,
            [Categoria.Restaurantes] = deseos,
        });

    [Theory]
    [InlineData(0, 100, 100, "H1", "SinIngresos")]
    [InlineData(1000, 500, 300, "H2", "Saludable")]              // ahorro 20% exacto
    [InlineData(1000, 600, 500, "H3", "DeficitPorDeseos")]       // ahorro -10%, deseos 50%
    [InlineData(1000, 1100, 100, "H4", "DeficitPorNecesidades")] // ahorro -20%, deseos 10%
    [InlineData(1000, 500, 350, "H5", "AceptablePorDeseos")]     // ahorro 15%, deseos 35%
    [InlineData(1000, 600, 250, "H6", "AceptablePorNecesidades")]// ahorro 15%, deseos 25%
    [InlineData(1000, 450, 500, "H7", "InsuficientePorDeseos")]  // ahorro 5%, deseos 50%
    [InlineData(1000, 700, 250, "H8", "InsuficientePorNecesidades")] // ahorro 5%, deseos 25%
    public void Diagnosticar_LlegaALaHojaEsperada(
        int ingresos, int necesidades, int deseos, string hoja, string codigo)
    {
        var resultado = ArbolDiagnostico.Diagnosticar(Hechos(ingresos, necesidades, deseos));

        Assert.Equal(hoja, resultado.HojaId);
        Assert.Equal(codigo, resultado.Diagnostico.Codigo);
    }

    [Fact]
    public void Diagnosticar_RegistraElCaminoComoExplicacion()
    {
        var resultado = ArbolDiagnostico.Diagnosticar(Hechos(1000, 500, 350));

        Assert.Equal(["P1", "P2", "P3", "P5", "P6"], resultado.Camino.Select(p => p.NodoId));
        Assert.Equal([true, false, false, true, true], resultado.Camino.Select(p => p.Respuesta));
        Assert.Equal(BaseConocimiento.R1Regla503020, resultado.Camino[1].Regla);
        Assert.Equal(BaseConocimiento.R2AhorroMinimo, resultado.Camino[3].Regla);
        Assert.Contains("15.0%", resultado.Camino[3].Observado);
    }

    [Fact]
    public void Diagnosticar_AhorroMinimoExacto_EsAceptable()
    {
        var resultado = ArbolDiagnostico.Diagnosticar(Hechos(1000, 550, 350)); // ahorro 10% exacto

        Assert.Equal("AceptablePorDeseos", resultado.Diagnostico.Codigo);
    }

    [Fact]
    public void RecorrerPreorden_VisitaNodoLuegoRamaSiLuegoRamaNo()
    {
        var recorrido = ArbolDiagnostico.RecorrerPreorden();

        Assert.Equal(
            ["P1", "P2", "H2", "P3", "P4", "H3", "H4", "P5", "P6", "H5", "H6", "P7", "H7", "H8", "H1"],
            recorrido.Select(n => n.Nodo.Id));
        Assert.Equal(0, recorrido[0].Profundidad);
        Assert.Null(recorrido[0].RamaDesdePadre);
        Assert.Equal(1, recorrido[1].Profundidad);
        Assert.True(recorrido[1].RamaDesdePadre);
        Assert.False(recorrido[^1].RamaDesdePadre);
    }

    [Fact]
    public void RecorrerPreorden_TodasLasHojasTienenCodigoDistinto()
    {
        var hojas = ArbolDiagnostico.RecorrerPreorden().Select(n => n.Nodo).OfType<NodoHoja>().ToList();

        Assert.Equal(8, hojas.Count);
        Assert.Equal(8, hojas.Select(h => h.Diagnostico.Codigo).Distinct().Count());
    }
}
