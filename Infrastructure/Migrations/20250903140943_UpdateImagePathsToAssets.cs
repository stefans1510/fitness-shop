using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateImagePathsToAssets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "admin-id",
                column: "ConcurrencyStamp",
                value: "781578f5-35e3-494f-be15-cd2c258159f7");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "company-id",
                column: "ConcurrencyStamp",
                value: "965e263a-7cf4-4fa6-a8a5-03cd6ad02dd6");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "customer-id",
                column: "ConcurrencyStamp",
                value: "72530681-d366-4d4c-b0a5-6690056a5f67");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "admin-id",
                column: "ConcurrencyStamp",
                value: "c4295fc2-dc4d-43d7-ae42-34bd4405c4df");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "company-id",
                column: "ConcurrencyStamp",
                value: "d2008d1a-b8f8-42bb-a8cb-faaa799c0662");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "customer-id",
                column: "ConcurrencyStamp",
                value: "37dcce46-d922-4b71-a31f-bd40e10b0613");
        }
    }
}
