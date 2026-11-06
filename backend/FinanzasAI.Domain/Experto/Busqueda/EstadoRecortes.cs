namespace FinanzasAI.Domain.Experto.Busqueda;

/// <summary>
/// Un estado del espacio de búsqueda: el nivel de recorte elegido para cada categoría recortable.
/// Niveles[i] es un índice en BaseConocimiento.NivelesRecortePorcentaje para la categoría i del problema.
/// Es inmutable y se compara por valor para poder detectar estados repetidos.
/// </summary>
public sealed class EstadoRecortes : IEquatable<EstadoRecortes>
{
    private readonly int[] _niveles;

    public EstadoRecortes(IEnumerable<int> niveles)
    {
        _niveles = niveles.ToArray();
    }

    public IReadOnlyList<int> Niveles => _niveles;

    public EstadoRecortes ConNivel(int indiceCategoria, int nivel)
    {
        var copia = (int[])_niveles.Clone();
        copia[indiceCategoria] = nivel;
        return new EstadoRecortes(copia);
    }

    public bool Equals(EstadoRecortes? otro) =>
        otro is not null && _niveles.AsSpan().SequenceEqual(otro._niveles);

    public override bool Equals(object? obj) => Equals(obj as EstadoRecortes);

    public override int GetHashCode()
    {
        var hash = new HashCode();
        foreach (var nivel in _niveles)
            hash.Add(nivel);
        return hash.ToHashCode();
    }

    public override string ToString() => "[" + string.Join(", ", _niveles) + "]";
}
