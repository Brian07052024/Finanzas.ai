using FinanzasAI.Domain.Movimientos;

namespace FinanzasAI.Domain.Experto.Flujo;

public record SobrePresupuesto(string Nombre, decimal Tope, decimal Demanda, decimal Asignado);

public record CategoriaFlujo(Categoria Categoria, bool EsNecesidad, decimal Gasto, decimal Asignado)
{
    public decimal SinCubrir => Gasto - Asignado;
}

public record AristaCorte(string Desde, string Hacia, decimal Capacidad, string Interpretacion);

public record DistribucionIngreso(
    decimal Ingresos,
    decimal DemandaTotal,
    decimal FlujoMaximo,
    decimal CapacidadCorte,
    IReadOnlyList<SobrePresupuesto> Sobres,
    IReadOnlyList<CategoriaFlujo> Categorias,
    IReadOnlyList<AristaCorte> Corte,
    RedFlujo Red,
    ResultadoFlujo Resultado)
{
    /// <summary>Ingreso que no se asignó a ningún gasto ni a la meta de ahorro.</summary>
    public decimal IngresoSinAsignar => Ingresos - FlujoMaximo;

    /// <summary>Gastos y meta de ahorro que no caben en el presupuesto 50/30/20.</summary>
    public decimal DemandaSinCubrir => DemandaTotal - FlujoMaximo;
}

/// <summary>
/// Modelo de flujo para la distribución del ingreso según la regla 50/30/20 (R1).
///
/// Red:
///   Fuente -> Ingreso                (capacidad: ingresos de la quincena)
///   Ingreso -> Necesidades           (capacidad: 50% del ingreso)
///   Ingreso -> Deseos                (capacidad: 30% del ingreso)
///   Ingreso -> Ahorro                (capacidad: 20% del ingreso)
///   Necesidades/Deseos -> Categoría  (capacidad: lo gastado en la categoría)
///   Categoría -> Destino             (capacidad: lo gastado en la categoría)
///   Ahorro -> Destino                (capacidad: meta de 20% del ingreso)
///
/// El flujo máximo es cuánto de los gastos más la meta de ahorro cabe en el presupuesto.
/// El corte mínimo dice qué límite lo impide: el ingreso total o alguno de los topes 50/30/20.
/// </summary>
public static class ModeloDistribucionIngreso
{
    public static DistribucionIngreso Calcular(HechosQuincena hechos)
    {
        var red = new RedFlujo();
        var fuente = red.AgregarNodo("Fuente");
        var ingreso = red.AgregarNodo("Ingreso");
        var necesidades = red.AgregarNodo("Necesidades");
        var deseos = red.AgregarNodo("Deseos");
        var ahorro = red.AgregarNodo("Ahorro");

        var topeNecesidades = decimal.Round(hechos.Ingresos * BaseConocimiento.FraccionMaximaNecesidades, 2);
        var topeDeseos = decimal.Round(hechos.Ingresos * BaseConocimiento.FraccionMaximaDeseos, 2);
        var topeAhorro = decimal.Round(hechos.Ingresos * BaseConocimiento.FraccionAhorroRecomendada, 2);

        var interpretaciones = new Dictionary<Arista, string>();

        var aristaIngreso = red.AgregarArista(fuente, ingreso, hechos.Ingresos);
        interpretaciones[aristaIngreso] =
            "El ingreso total es el límite: no alcanza para cubrir los gastos y la meta de ahorro.";
        // Como los topes 50/30/20 suman el 100% del ingreso, si esta arista se satura también se
        // saturan los tres topes, y el corte cercano al sumidero señala esos topes en su lugar.
        // Solo aparecería si el redondeo de los topes dejara un centavo de diferencia.

        var aristaNecesidades = red.AgregarArista(ingreso, necesidades, topeNecesidades);
        interpretaciones[aristaNecesidades] =
            "El tope de 50% para necesidades (R1) está lleno: lo gastado en necesidades por encima del tope no cabe.";

        var aristaDeseos = red.AgregarArista(ingreso, deseos, topeDeseos);
        interpretaciones[aristaDeseos] =
            "El tope de 30% para deseos (R1) está lleno: lo gastado en deseos por encima del tope no cabe.";

        var aristaAhorro = red.AgregarArista(ingreso, ahorro, topeAhorro);
        interpretaciones[aristaAhorro] = "La meta de ahorro de 20% (R1) queda cubierta por completo.";

        // Las categorías se crean en el orden del enum; el destino va al final.
        var categorias = hechos.GastosPorCategoria
            .Where(g => g.Value > 0)
            .OrderBy(g => g.Key)
            .ToList();
        var nodosCategoria = categorias.Select(g => red.AgregarNodo(g.Key.ToString())).ToList();
        var destino = red.AgregarNodo("Destino");

        var aristasCategoria = new List<Arista>();
        for (var i = 0; i < categorias.Count; i++)
        {
            var (categoria, gasto) = (categorias[i].Key, categorias[i].Value);
            var sobre = BaseConocimiento.EsNecesidad(categoria) ? necesidades : deseos;
            var arista = red.AgregarArista(sobre, nodosCategoria[i], gasto);
            interpretaciones[arista] = $"El gasto en {categoria} queda cubierto por completo.";
            aristasCategoria.Add(arista);

            var salida = red.AgregarArista(nodosCategoria[i], destino, gasto);
            interpretaciones[salida] = $"El gasto en {categoria} queda cubierto por completo.";
        }

        var metaAhorro = red.AgregarArista(ahorro, destino, topeAhorro);
        interpretaciones[metaAhorro] = "La meta de ahorro de 20% (R1) queda cubierta por completo.";

        var resultado = EdmondsKarp.Ejecutar(red, fuente, destino);

        var sobres = new List<SobrePresupuesto>
        {
            new("Necesidades", topeNecesidades, hechos.Necesidades, aristaNecesidades.Flujo),
            new("Deseos", topeDeseos, hechos.Deseos, aristaDeseos.Flujo),
            new("Ahorro", topeAhorro, topeAhorro, aristaAhorro.Flujo),
        };

        var categoriasFlujo = categorias
            .Select((g, i) => new CategoriaFlujo(
                g.Key, BaseConocimiento.EsNecesidad(g.Key), g.Value, aristasCategoria[i].Flujo))
            .ToList();

        var corte = resultado.Corte
            .Select(a => new AristaCorte(
                red.Nombres[a.Desde], red.Nombres[a.Hacia], a.Capacidad, interpretaciones[a]))
            .ToList();

        return new DistribucionIngreso(
            hechos.Ingresos,
            hechos.Gastos + topeAhorro,
            resultado.FlujoMaximo,
            resultado.CapacidadCorte,
            sobres,
            categoriasFlujo,
            corte,
            red,
            resultado);
    }
}
