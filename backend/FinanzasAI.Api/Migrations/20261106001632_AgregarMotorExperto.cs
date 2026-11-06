using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanzasAI.Api.Migrations
{
    /// <inheritdoc />
    public partial class AgregarMotorExperto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ConfiguracionesAhorro",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false),
                    PorcentajeMeta = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConfiguracionesAhorro", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PesosSacrificio",
                columns: table => new
                {
                    Categoria = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Peso = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    Rechazos = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PesosSacrificio", x => x.Categoria);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConfiguracionesAhorro");

            migrationBuilder.DropTable(
                name: "PesosSacrificio");
        }
    }
}
