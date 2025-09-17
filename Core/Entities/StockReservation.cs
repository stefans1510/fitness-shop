namespace Core.Entities
{
    public class StockReservation : BaseEntity
    {
        public required string ReservationId { get; set; } // Payment Intent ID
        public int ProductId { get; set; }
        public int ReservedQuantity { get; set; }
        public DateTime ReservedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddMinutes(30); // 30 min expiry
        public bool IsCommitted { get; set; } = false;
        
        // Navigation property
        public Product Product { get; set; } = null!;
    }
}
