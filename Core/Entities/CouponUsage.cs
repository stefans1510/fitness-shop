namespace Core.Entities
{
    public class CouponUsage : BaseEntity
    {
        public required string UserId { get; set; }
        public required int CouponId { get; set; }
        public required string OrderId { get; set; } // Reference to order
        public decimal DiscountAmount { get; set; }
        public DateTime UsedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public Coupon Coupon { get; set; } = null!;
    }
}