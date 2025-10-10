using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameIsCompanyOnlyToIsCustomerOnly : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IsCompanyOnly",
                table: "Coupons",
                newName: "IsCustomerOnly");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "admin-id",
                column: "ConcurrencyStamp",
                value: "c3cc8141-d815-45c5-8ab7-9871c6235516");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "company-id",
                column: "ConcurrencyStamp",
                value: "ae850dd0-346a-48b2-850a-d2bb8ea98d82");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "customer-id",
                column: "ConcurrencyStamp",
                value: "7a763958-91d6-4276-aced-4c0ea3f7adfb");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IsCustomerOnly",
                table: "Coupons",
                newName: "IsCompanyOnly");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "admin-id",
                column: "ConcurrencyStamp",
                value: "b4c436fe-5550-4d77-8a6c-fb4b62fd58af");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "company-id",
                column: "ConcurrencyStamp",
                value: "c6bed579-7891-4c44-8ad1-b62d50c5b02e");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "customer-id",
                column: "ConcurrencyStamp",
                value: "1c69a44f-4856-4faa-ba23-45a1caa72620");
        }
    }
}
