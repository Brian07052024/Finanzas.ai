using FinanzasAI.Domain.Experto;
using FinanzasAI.Domain.Experto.Busqueda;
using FinanzasAI.Domain.Movimientos;

namespace FinanzasAI.Tests.Experto;

public class BusquedaTests
{
    private static ProblemaRecortes Problema(
        decimal ahorroActual,
        decimal meta,
        params (Categoria Categoria, decimal Gasto, decimal Peso)[] categorias) =>
        new(categorias.Select(c => new CategoriaRecortable(c.Categoria, c.Gasto, c.Peso)).ToList(), ahorroActual, meta);

    [Fact]
    public void Crear_SoloIncluyeDeseosConGasto()
    {
        var hechos = new HechosQuincena(1000m, new Dictionary<Categoria, decimal>
        {
            [Categoria.Vivienda] = 400m,
            [Categoria.Ropa] = 100m,
            [Categoria.Restaurantes] = 200m,
        });

        var problema = ProblemaRecortes.Crear(hechos, 0.20m, new Dictionary<Categoria, decimal>());

        Assert.Equal([Categoria.Restaurantes, Categoria.Ropa], problema.Categorias.Select(c => c.Categoria));
        Assert.Equal(300m, problema.AhorroActual);
        Assert.Equal(200m, problema.Meta);
    }

    [Fact]
    public void Exhaustiva_ExploraTodoElEspacioDeEstados()
    {
        var problema = Problema(0m, 100m,
            (Categoria.Restaurantes, 200m, 1m),
            (Categoria.Ropa, 200m, 1m),
            (Categoria.Suscripciones, 200m, 1m));

        var resultado = BusquedaExhaustiva.Ejecutar(problema);

        Assert.Equal(64, resultado.EstadosExplorados); // 4^3
        Assert.Equal(64, problema.TotalEstados);
    }

    [Fact]
    public void AEstrella_ExploraMenosEstadosQueLaExhaustiva()
    {
        var problema = Problema(0m, 300m,
            (Categoria.Restaurantes, 400m, 1m),
            (Categoria.Entretenimiento, 300m, 2m),
            (Categoria.Ropa, 200m, 1m),
            (Categoria.Suscripciones, 100m, 4m),
            (Categoria.Otros, 150m, 1m));

        var exhaustiva = BusquedaExhaustiva.Ejecutar(problema);
        var aEstrella = BusquedaAEstrella.Ejecutar(problema);

        Assert.Equal(exhaustiva.Costo, aEstrella.Costo);
        Assert.True(aEstrella.EstadosExplorados < exhaustiva.EstadosExplorados);
    }

    [Fact]
    public void AmbasEncuentranElMismoSacrificioMinimo_EnProblemasAleatorios()
    {
        var aleatorio = new Random(20261105);
        decimal[] pesos = [1m, 1.5m, 2m, 4m, 8m];

        for (var caso = 0; caso < 200; caso++)
        {
            var categorias = Enum.GetValues<Categoria>()
                .Where(c => !BaseConocimiento.EsNecesidad(c))
                .Take(aleatorio.Next(1, 6))
                .Select(c => (c, aleatorio.Next(1, 200_000) / 100m, pesos[aleatorio.Next(pesos.Length)]))
                .ToArray();
            var ahorroActual = aleatorio.Next(-100_000, 100_000) / 100m;
            var meta = aleatorio.Next(0, 200_000) / 100m;
            var problema = Problema(ahorroActual, meta, categorias);

            var exhaustiva = BusquedaExhaustiva.Ejecutar(problema);
            var aEstrella = BusquedaAEstrella.Ejecutar(problema);

            Assert.Equal(exhaustiva.Costo, aEstrella.Costo);
            Assert.Equal(problema.EsAlcanzable, exhaustiva.Solucion is not null);
        }
    }

    [Fact]
    public void MetaYaCumplida_NoRecortaNada()
    {
        var problema = Problema(500m, 200m, (Categoria.Ropa, 300m, 1m));

        var aEstrella = BusquedaAEstrella.Ejecutar(problema);
        var exhaustiva = BusquedaExhaustiva.Ejecutar(problema);

        Assert.Equal(0m, aEstrella.Costo);
        Assert.Equal(1, aEstrella.EstadosExplorados);
        Assert.Equal(0m, exhaustiva.Costo);
        Assert.Empty(problema.ConstruirPlan(aEstrella.Solucion!).Recortes);
    }

    [Fact]
    public void MetaInalcanzable_NingunaEncuentraSolucion()
    {
        // Recorte máximo: 75% de 100 = 75, y faltan 100.
        var problema = Problema(0m, 100m, (Categoria.Ropa, 100m, 1m));

        Assert.False(problema.EsAlcanzable);
        Assert.Null(BusquedaExhaustiva.Ejecutar(problema).Solucion);
        Assert.Null(BusquedaAEstrella.Ejecutar(problema).Solucion);
    }

    [Fact]
    public void ElRecorteNuncaPasaDe75Porciento()
    {
        var problema = Problema(-1000m, 0m, (Categoria.Ropa, 1000m, 1m), (Categoria.Otros, 400m, 1m));

        var plan = problema.ConstruirPlan(BusquedaAEstrella.Ejecutar(problema).Solucion!);

        Assert.All(plan.Recortes, r => Assert.True(r.Porcentaje <= 75));
        Assert.True(plan.CumpleMeta);
    }

    [Fact]
    public void Heuristica_NoSobreestimaElCostoReal()
    {
        var problema = Problema(0m, 300m,
            (Categoria.Restaurantes, 400m, 2m),
            (Categoria.Ropa, 200m, 3m));
        var optimo = BusquedaExhaustiva.Ejecutar(problema).Costo!.Value;

        Assert.True(problema.Heuristica(problema.EstadoInicial) <= optimo);
    }

    [Fact]
    public void Plan_OrdenaLosRecortesDeMayorAMenor()
    {
        var problema = Problema(-500m, 0m,
            (Categoria.Restaurantes, 100m, 1m),
            (Categoria.Ropa, 800m, 1m));

        var plan = problema.ConstruirPlan(problema.EstadoMaximo);

        Assert.Equal([Categoria.Ropa, Categoria.Restaurantes], plan.Recortes.Select(r => r.Categoria));
    }
}
