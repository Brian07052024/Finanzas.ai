using FinanzasAI.Domain.Experto;
using FinanzasAI.Domain.Experto.Aprendizaje;
using FinanzasAI.Domain.Experto.Busqueda;
using FinanzasAI.Domain.Movimientos;

namespace FinanzasAI.Tests.Experto;

public class AprendizajeTests
{
    [Fact]
    public void PesoNuevo_EmpiezaEnUno()
    {
        var peso = new PesoSacrificio(Categoria.Ropa);

        Assert.Equal(1m, peso.Peso);
        Assert.Equal(0, peso.Rechazos);
    }

    [Fact]
    public void CadaRechazo_DuplicaElPeso()
    {
        var peso = new PesoSacrificio(Categoria.Ropa);

        peso.RegistrarRechazo();
        peso.RegistrarRechazo();

        Assert.Equal(4m, peso.Peso);
        Assert.Equal(2, peso.Rechazos);
    }

    [Fact]
    public void Necesidad_NoTienePeso()
    {
        Assert.Throws<ArgumentException>(() => new PesoSacrificio(Categoria.Vivienda));
    }

    [Fact]
    public void RechazarUnaCategoria_CambiaElSiguientePlan()
    {
        // Faltan 100 para la meta: recortar 25% de Restaurantes o 25% de Ropa cuesta lo mismo.
        var hechos = new HechosQuincena(1000m, new Dictionary<Categoria, decimal>
        {
            [Categoria.Supermercado] = 100m,
            [Categoria.Restaurantes] = 400m,
            [Categoria.Ropa] = 400m,
        });
        var restaurantes = new PesoSacrificio(Categoria.Restaurantes);
        var ropa = new PesoSacrificio(Categoria.Ropa);
        Dictionary<Categoria, decimal> Pesos() => new()
        {
            [restaurantes.Categoria] = restaurantes.Peso,
            [ropa.Categoria] = ropa.Peso,
        };

        var problemaAntes = ProblemaRecortes.Crear(hechos, 0.20m, Pesos());
        var planAntes = problemaAntes.ConstruirPlan(BusquedaAEstrella.Ejecutar(problemaAntes).Solucion!);

        restaurantes.RegistrarRechazo();

        var problemaDespues = ProblemaRecortes.Crear(hechos, 0.20m, Pesos());
        var planDespues = problemaDespues.ConstruirPlan(BusquedaAEstrella.Ejecutar(problemaDespues).Solucion!);

        Assert.Equal([Categoria.Restaurantes], planAntes.Recortes.Select(r => r.Categoria));
        Assert.Equal([Categoria.Ropa], planDespues.Recortes.Select(r => r.Categoria));
        Assert.Equal(100m, planDespues.Sacrificio);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(101)]
    public void Meta_FueraDeRango_SeRechaza(int porcentaje)
    {
        var configuracion = new ConfiguracionAhorro();

        Assert.Throws<ArgumentException>(() => configuracion.CambiarMeta(porcentaje));
    }

    [Fact]
    public void Meta_PorDefecto_Es20Porciento()
    {
        Assert.Equal(0.20m, new ConfiguracionAhorro().FraccionMeta);
    }
}
