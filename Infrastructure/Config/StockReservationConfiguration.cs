using Core.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Config
{
    public class StockReservationConfiguration : IEntityTypeConfiguration<StockReservation>
    {
        public void Configure(EntityTypeBuilder<StockReservation> builder)
        {
            builder.Property(x => x.ReservationId)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(x => x.ReservedQuantity)
                .IsRequired();

            builder.Property(x => x.ReservedAt)
                .IsRequired();

            builder.Property(x => x.ExpiresAt)
                .IsRequired();

            builder.Property(x => x.IsCommitted)
                .IsRequired();

            builder.HasOne(x => x.Product)
                .WithMany()
                .HasForeignKey(x => x.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(x => x.ReservationId);
            builder.HasIndex(x => new { x.ProductId, x.IsCommitted });
        }
    }
}
