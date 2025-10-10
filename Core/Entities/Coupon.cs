namespace Core.Entities
{
    public class Coupon : BaseEntity
    {
        public required string Code { get; set; }
        public required string Description { get; set; }
        public CouponType Type { get; set; }
        public decimal Value { get; set; } // Percentage or fixed amount
        public decimal? MinimumOrderAmount { get; set; }
        public decimal? MaximumDiscountAmount { get; set; } // For percentage coupons
        public DateTime ValidFrom { get; set; }
        public DateTime ValidUntil { get; set; }
        public int? UsageLimit { get; set; } // Null for unlimited
        public int UsageCount { get; set; } = 0;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsCustomerOnly { get; set; } = false; // Only for regular customers (not company users)

        // Navigation property
        public ICollection<CouponUsage> CouponUsages { get; set; } = [];
    }

    public enum CouponType
    {
        Percentage = 1,
        FixedAmount = 2
    }
}