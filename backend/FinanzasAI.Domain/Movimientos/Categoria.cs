namespace FinanzasAI.Domain.Movimientos;

/// <summary>
/// Categorías fijas de gasto. Los ingresos no llevan categoría.
/// Los nombres van sin acentos; la interfaz se encarga de mostrarlos con acento.
/// La clasificación en necesidades y deseos vive en Experto.BaseConocimiento.
/// </summary>
public enum Categoria
{
    Vivienda,
    Supermercado,
    Restaurantes,
    Transporte,
    Servicios,
    Salud,
    Educacion,
    Entretenimiento,
    Ropa,
    Suscripciones,
    Otros
}
