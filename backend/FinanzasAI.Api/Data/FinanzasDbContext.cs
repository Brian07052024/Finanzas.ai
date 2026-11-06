using FinanzasAI.Domain.Experto;
using FinanzasAI.Domain.Experto.Aprendizaje;
using FinanzasAI.Domain.Movimientos;
using Microsoft.EntityFrameworkCore;

namespace FinanzasAI.Api.Data;

public class FinanzasDbContext : DbContext
{
    public FinanzasDbContext(DbContextOptions<FinanzasDbContext> dbContextOptions) : base(dbContextOptions)
    {

    }

    public DbSet<Movimiento> Movimientos => Set<Movimiento>();
    public DbSet<PesoSacrificio> PesosSacrificio => Set<PesoSacrificio>();
    public DbSet<ConfiguracionAhorro> ConfiguracionesAhorro => Set<ConfiguracionAhorro>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Movimiento>(movimiento =>
        {
            movimiento.Property(m => m.Tipo)
                .HasConversion<string>()
                .HasMaxLength(20);

            movimiento.Property(m => m.Monto)
                .HasPrecision(12, 2);

            movimiento.Property(m => m.Categoria)
                .HasConversion<string>()
                .HasMaxLength(30);

            movimiento.Property(m => m.Descripcion)
                .HasMaxLength(Movimiento.LargoMaximoDescripcion);

            movimiento.HasIndex(m => m.Fecha);
        });

        modelBuilder.Entity<PesoSacrificio>(peso =>
        {
            peso.HasKey(p => p.Categoria);

            peso.Property(p => p.Categoria)
                .HasConversion<string>()
                .HasMaxLength(30);

            peso.Property(p => p.Peso)
                .HasPrecision(18, 4);
        });

        modelBuilder.Entity<ConfiguracionAhorro>(configuracion =>
        {
            configuracion.Property(c => c.Id)
                .ValueGeneratedNever();

            configuracion.Ignore(c => c.FraccionMeta);
        });
    }
}
