using System.ComponentModel.DataAnnotations;

namespace API.DTOs
{
    public class CreateCouponDto
    {
        [Required]
        [StringLength(50, ErrorMessage = "Coupon code cannot exceed 50 characters")]
        public string Code { get; set; } = string.Empty;

        [Required]
        [StringLength(200, ErrorMessage = "Description cannot exceed 200 characters")]
        public string Description { get; set; } = string.Empty;

        [Required]
        [Range(1, 2, ErrorMessage = "Type must be 1 (Percentage) or 2 (FixedAmount)")]
        public int Type { get; set; }

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Value must be greater than 0")]
        public decimal Value { get; set; }

        [Range(0.01, double.MaxValue, ErrorMessage = "Minimum order amount must be greater than 0")]
        public decimal? MinimumOrderAmount { get; set; }

        [Range(0.01, double.MaxValue, ErrorMessage = "Maximum discount amount must be greater than 0")]
        public decimal? MaximumDiscountAmount { get; set; }

        [Required]
        public DateTime ValidFrom { get; set; }

        [Required]
        public DateTime ValidUntil { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Usage limit must be at least 1")]
        public int? UsageLimit { get; set; }

        public bool IsCustomerOnly { get; set; } = false;
    }
}