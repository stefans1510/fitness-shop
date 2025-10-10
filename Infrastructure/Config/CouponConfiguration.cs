using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Config
{
    public class CouponConfiguration : IEntityTypeConfiguration<Coupon>
    {
        public void Configure(EntityTypeBuilder<Coupon> builder)
        {
            builder.Property(x => x.Code)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(x => x.Description)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(x => x.Value)
                .HasColumnType("decimal(18,2)");

            builder.Property(x => x.MinimumOrderAmount)
                .HasColumnType("decimal(18,2)");

            builder.Property(x => x.MaximumDiscountAmount)
                .HasColumnType("decimal(18,2)");

            builder.Property(x => x.Type)
                .HasConversion<string>()
                .IsRequired();

            // Create unique index on coupon code
            builder.HasIndex(x => x.Code)
                .IsUnique();

            // Configure relationships
            builder.HasMany(x => x.CouponUsages)
                .WithOne(x => x.Coupon)
                .HasForeignKey(x => x.CouponId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}