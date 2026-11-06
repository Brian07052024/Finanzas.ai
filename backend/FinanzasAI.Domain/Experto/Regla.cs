namespace FinanzasAI.Domain.Experto;

/// <summary>
/// Una regla de la base de conocimiento: qué dice y de dónde sale.
/// </summary>
public record Regla(string Codigo, string Enunciado, string Fuente);
