using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanzasAI.Api.Migrations
{
    /// <inheritdoc />
    public partial class ReclasificarComida : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // La categoría Comida se dividió en Supermercado (necesidad) y Restaurantes (deseo).
            // Los gastos registrados como Comida antes del cambio eran comidas fuera de casa.
            migrationBuilder.Sql(
                """UPDATE "Movimientos" SET "Categoria" = 'Restaurantes' WHERE "Categoria" = 'Comida';""");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Sin reversa: después de aplicarla no se distingue qué Restaurantes venían de Comida.
        }
    }
}
