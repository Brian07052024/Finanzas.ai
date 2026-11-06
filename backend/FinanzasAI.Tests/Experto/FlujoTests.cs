using FinanzasAI.Domain.Experto;
using FinanzasAI.Domain.Experto.Flujo;
using FinanzasAI.Domain.Movimientos;

namespace FinanzasAI.Tests.Experto;

public class FlujoTests
{
    [Fact]
    public void EdmondsKarp_EjemploClasico_FlujoMaximo23()
    {
        // Red de Cormen et al., Introduction to Algorithms, figura 26.1.
        var red = new RedFlujo();
        var s = red.AgregarNodo("s");
        var v1 = red.AgregarNodo("v1");
        var v2 = red.AgregarNodo("v2");
        var v3 = red.AgregarNodo("v3");
        var v4 = red.AgregarNodo("v4");
        var t = red.AgregarNodo("t");
        red.AgregarArista(s, v1, 16);
        red.AgregarArista(s, v2, 13);
        red.AgregarArista(v1, v3, 12);
        red.AgregarArista(v2, v1, 4);
        red.AgregarArista(v2, v4, 14);
        red.AgregarArista(v3, v2, 9);
        red.AgregarArista(v3, t, 20);
        red.AgregarArista(v4, v3, 7);
        red.AgregarArista(v4, t, 4);

        var resultado = EdmondsKarp.Ejecutar(red, s, t);

        Assert.Equal(23m, resultado.FlujoMaximo);
        Assert.Equal(23m, resultado.CapacidadCorte);
    }

    [Fact]
    public void FlujoMaximo_IgualCorteMinimo_YRespetaCapacidadYConservacion_EnRedesAleatorias()
    {
        var aleatorio = new Random(20261105);

        for (var caso = 0; caso < 100; caso++)
        {
            var red = new RedFlujo();
            var nodos = aleatorio.Next(2, 10);
            for (var i = 0; i < nodos; i++)
                red.AgregarNodo($"n{i}");

            var aristas = aleatorio.Next(1, nodos * 3);
            for (var i = 0; i < aristas; i++)
            {
                var desde = aleatorio.Next(nodos);
                var hacia = aleatorio.Next(nodos);
                if (desde != hacia)
                    red.AgregarArista(desde, hacia, aleatorio.Next(0, 5000) / 100m);
            }

            var fuente = 0;
            var sumidero = nodos - 1;
            var resultado = EdmondsKarp.Ejecutar(red, fuente, sumidero);

            // Teorema de flujo máximo y corte mínimo.
            Assert.Equal(resultado.FlujoMaximo, resultado.CapacidadCorte);

            // Restricción de capacidad.
            Assert.All(red.Aristas, a => Assert.InRange(a.Flujo, 0m, a.Capacidad));

            // Conservación del flujo en los nodos intermedios.
            for (var nodo = 1; nodo < sumidero; nodo++)
            {
                var entra = red.Aristas.Where(a => a.Hacia == nodo).Sum(a => a.Flujo);
                var sale = red.Aristas.Where(a => a.Desde == nodo).Sum(a => a.Flujo);
                Assert.Equal(entra, sale);
            }
        }
    }

    [Fact]
    public void Distribucion_NecesidadesSobreElTope_ElCorteSenalaElTopeDeNecesidades()
    {
        var hechos = new HechosQuincena(1000m, new Dictionary<Categoria, decimal>
        {
            [Categoria.Vivienda] = 600m,
            [Categoria.Restaurantes] = 200m,
        });

        var distribucion = ModeloDistribucionIngreso.Calcular(hechos);

        // Necesidades: tope 500 de 600. Deseos: 200 de 300. Ahorro: 200 de 200.
        Assert.Equal(900m, distribucion.FlujoMaximo);
        Assert.Equal(1000m, distribucion.DemandaTotal);
        Assert.Equal(100m, distribucion.DemandaSinCubrir);
        Assert.Equal(100m, distribucion.IngresoSinAsignar);
        Assert.Equal(distribucion.FlujoMaximo, distribucion.CapacidadCorte);

        Assert.Contains(distribucion.Corte, a => a.Desde == "Ingreso" && a.Hacia == "Necesidades");
        Assert.Equal(100m, distribucion.Categorias.Single(c => c.Categoria == Categoria.Vivienda).SinCubrir);
        Assert.Equal(0m, distribucion.Categorias.Single(c => c.Categoria == Categoria.Restaurantes).SinCubrir);
    }

    [Fact]
    public void Distribucion_GastosDentroDelPresupuesto_TodoQuedaCubierto()
    {
        var hechos = new HechosQuincena(1000m, new Dictionary<Categoria, decimal>
        {
            [Categoria.Vivienda] = 400m,
            [Categoria.Ropa] = 200m,
        });

        var distribucion = ModeloDistribucionIngreso.Calcular(hechos);

        Assert.Equal(800m, distribucion.FlujoMaximo);
        Assert.Equal(0m, distribucion.DemandaSinCubrir);
        Assert.Equal(200m, distribucion.IngresoSinAsignar);
        Assert.DoesNotContain(distribucion.Corte, a => a.Desde == "Fuente" || a.Hacia is "Necesidades" or "Deseos");
    }

    [Fact]
    public void Distribucion_SinIngresos_FlujoCero()
    {
        var hechos = new HechosQuincena(0m, new Dictionary<Categoria, decimal> { [Categoria.Ropa] = 100m });

        var distribucion = ModeloDistribucionIngreso.Calcular(hechos);

        Assert.Equal(0m, distribucion.FlujoMaximo);
        Assert.Equal(0m, distribucion.CapacidadCorte);
        Assert.Equal(100m, distribucion.DemandaSinCubrir);
    }

    [Fact]
    public void Distribucion_TodosLosTopesLlenos_ElCorteSenalaLosTopesYNoSoloElIngreso()
    {
        // Los topes 50/30/20 suman todo el ingreso, así que {Fuente -> Ingreso} también es un corte
        // mínimo; se espera el más cercano al sumidero, que dice qué topes están llenos.
        var hechos = new HechosQuincena(1000m, new Dictionary<Categoria, decimal>
        {
            [Categoria.Vivienda] = 600m,
            [Categoria.Ropa] = 400m,
        });

        var distribucion = ModeloDistribucionIngreso.Calcular(hechos);

        Assert.Equal(1000m, distribucion.FlujoMaximo);
        Assert.Equal(1000m, distribucion.CapacidadCorte);
        Assert.DoesNotContain(distribucion.Corte, a => a.Desde == "Fuente");
        Assert.Contains(distribucion.Corte, a => a.Desde == "Ingreso" && a.Hacia == "Necesidades");
        Assert.Contains(distribucion.Corte, a => a.Desde == "Ingreso" && a.Hacia == "Deseos");
    }
}
