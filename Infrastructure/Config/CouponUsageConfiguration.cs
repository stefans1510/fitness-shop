using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Config
{
    public class CouponUsageConfiguration : IEntityTypeConfiguration<CouponUsage>
    {
        public void Configure(EntityTypeBuilder<CouponUsage> builder)
        {
            builder.Property(x => x.DiscountAmount)
                .HasColumnType("decimal(18,2)");

            builder.Property(x => x.UserId)
                .IsRequired()
                .HasMaxLength(450); // Standard Identity user ID length

            // Configure relationships
            builder.HasOne(x => x.Coupon)
                .WithMany(c => c.CouponUsages)
                .HasForeignKey(x => x.CouponId)
                .OnDelete(DeleteBehavior.Cascade);

            // Create composite index for efficient queries
            builder.HasIndex(x => new { x.UserId, x.CouponId });
            
            // Index for date-based queries
            builder.HasIndex(x => x.UsedAt);
        }
    }
}