using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateProductImagePaths : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "admin-id",
                column: "ConcurrencyStamp",
                value: "e72ccf4c-a520-4507-80e6-c2932843e8f4");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "company-id",
                column: "ConcurrencyStamp",
                value: "c4f4dc9a-b5aa-43c1-bd12-778ed89669ca");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "customer-id",
                column: "ConcurrencyStamp",
                value: "51d46d7b-00fb-42d5-94d8-777b09595224");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "admin-id",
                column: "ConcurrencyStamp",
                value: "34c0550a-6775-41e7-8d96-8424e406a814");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "company-id",
                column: "ConcurrencyStamp",
                value: "3139a901-e97e-4f60-b6a5-df2de6efe0a6");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "customer-id",
                column: "ConcurrencyStamp",
                value: "19bad67a-980e-476b-9122-33e1e73f6b56");
        }
    }
}
