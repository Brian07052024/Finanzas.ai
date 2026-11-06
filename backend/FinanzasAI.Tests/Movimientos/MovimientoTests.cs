using FinanzasAI.Domain.Movimientos;

namespace FinanzasAI.Tests.Movimientos;

public class MovimientoTests
{
    private static readonly DateOnly Fecha = new(2026, 11, 4);

    [Fact]
    public void Gasto_ConCategoria_SeCrea()
    {
        var movimiento = new Movimiento(TipoMovimiento.Gasto, 150.50m, Fecha, Categoria.Supermercado, "Súper");

        Assert.Equal(TipoMovimiento.Gasto, movimiento.Tipo);
        Assert.Equal(150.50m, movimiento.Monto);
        Assert.Equal(Fecha, movimiento.Fecha);
        Assert.Equal(Categoria.Supermercado, movimiento.Categoria);
        Assert.Equal("Súper", movimiento.Descripcion);
    }

    [Fact]
    public void Ingreso_SinCategoria_SeCrea()
    {
        var movimiento = new Movimiento(TipoMovimiento.Ingreso, 8000m, Fecha, null, null);

        Assert.Equal(TipoMovimiento.Ingreso, movimiento.Tipo);
        Assert.Null(movimiento.Categoria);
    }

    [Theory]
    [InlineData("0")]
    [InlineData("-10")]
    public void Monto_CeroONegativo_SeRechaza(string monto)
    {
        Assert.Throws<ArgumentException>(() =>
            new Movimiento(TipoMovimiento.Ingreso, decimal.Parse(monto), Fecha, null, null));
    }

    [Fact]
    public void Monto_ConMasDeDosDecimales_SeRechaza()
    {
        Assert.Throws<ArgumentException>(() =>
            new Movimiento(TipoMovimiento.Ingreso, 10.005m, Fecha, null, null));
    }

    [Fact]
    public void Monto_MayorQueElMaximo_SeRechaza()
    {
        Assert.Throws<ArgumentException>(() =>
            new Movimiento(TipoMovimiento.Ingreso, Movimiento.MontoMaximo + 0.01m, Fecha, null, null));
    }

    [Fact]
    public void Monto_IgualAlMaximo_SeAcepta()
    {
        var movimiento = new Movimiento(TipoMovimiento.Ingreso, Movimiento.MontoMaximo, Fecha, null, null);

        Assert.Equal(Movimiento.MontoMaximo, movimiento.Monto);
    }

    [Fact]
    public void Gasto_SinCategoria_SeRechaza()
    {
        Assert.Throws<ArgumentException>(() =>
            new Movimiento(TipoMovimiento.Gasto, 100m, Fecha, null, null));
    }

    [Fact]
    public void Ingreso_ConCategoria_SeRechaza()
    {
        Assert.Throws<ArgumentException>(() =>
            new Movimiento(TipoMovimiento.Ingreso, 100m, Fecha, Categoria.Otros, null));
    }

    [Fact]
    public void Tipo_NoDefinido_SeRechaza()
    {
        Assert.Throws<ArgumentException>(() =>
            new Movimiento((TipoMovimiento)99, 100m, Fecha, null, null));
    }

    [Fact]
    public void Categoria_NoDefinida_SeRechaza()
    {
        Assert.Throws<ArgumentException>(() =>
            new Movimiento(TipoMovimiento.Gasto, 100m, Fecha, (Categoria)99, null));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Descripcion_Vacia_QuedaEnNull(string descripcion)
    {
        var movimiento = new Movimiento(TipoMovimiento.Ingreso, 100m, Fecha, null, descripcion);

        Assert.Null(movimiento.Descripcion);
    }

    [Fact]
    public void Descripcion_SeRecortaLosEspacios()
    {
        var movimiento = new Movimiento(TipoMovimiento.Ingreso, 100m, Fecha, null, "  Nómina  ");

        Assert.Equal("Nómina", movimiento.Descripcion);
    }

    [Fact]
    public void Descripcion_DeLargoMaximo_SeAcepta()
    {
        var descripcion = new string('a', Movimiento.LargoMaximoDescripcion);

        var movimiento = new Movimiento(TipoMovimiento.Ingreso, 100m, Fecha, null, descripcion);

        Assert.Equal(descripcion, movimiento.Descripcion);
    }

    [Fact]
    public void Descripcion_MasLargaQueElMaximo_SeRechaza()
    {
        var descripcion = new string('a', Movimiento.LargoMaximoDescripcion + 1);

        Assert.Throws<ArgumentException>(() =>
            new Movimiento(TipoMovimiento.Ingreso, 100m, Fecha, null, descripcion));
    }
}
