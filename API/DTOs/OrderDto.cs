using Core.Entities.OrderAggregate;

namespace API.DTOs
{
    public class OrderDto
    {
        public int Id { get; set; }
        public DateTime OrderDate { get; set; } = DateTime.UtcNow;
        public required string BuyerEmail { get; set; }
        public required ShippingAddress ShippingAddress { get; set; }
        public required string DeliveryMethod { get; set; }
        public decimal ShippingPrice { get; set; }
        public required PaymentSummary PaymentSummary { get; set; }
        public required List<OrderItemDto> OrderItems { get; set; }
        public decimal Subtotal { get; set; }
        public decimal DiscountAmount { get; set; } = 0;
        public string? AppliedCouponCode { get; set; }
        public required string Status { get; set; }
        public decimal Total { get; set; }
        public required string PaymentIntentId { get; set; }
    }
}