using Core.Entities.OrderAggregate;

namespace Core.Specifications
{
    public class OrderSpecification : BaseSpecification<Order>
    {
        public OrderSpecification(string email) : base(x => x.BuyerEmail == email)
        {
            AddInclude(x => x.OrderItems);
            AddInclude(x => x.DeliveryMethod);
            AddOrderByDesc(x => x.OrderDate);
        }

        public OrderSpecification(string email, int id) : base(x =>
            x.BuyerEmail == email && x.Id == id
        )
        {
            AddInclude("OrderItems");
            AddInclude("DeliveryMethod");
        }

        public OrderSpecification(string paymentIntentId, bool isPaymentIntent) :
            base(x => x.PaymentIntentId == paymentIntentId)
        {
            AddInclude("OrderItems");
            AddInclude("DeliveryMethod");
        }

        public OrderSpecification(OrderSpecificationParameters orderSpecParams) : base(x =>
            string.IsNullOrEmpty(orderSpecParams.Status) || x.Status == ParseStatus(orderSpecParams.Status)
        )
        {
            AddInclude("OrderItems");
            AddInclude("DeliveryMethod");
            ApplyPaging(
                orderSpecParams.PageSize * (orderSpecParams.PageIndex - 1),
                orderSpecParams.PageSize
            );  
            AddOrderByDesc(x => x.OrderDate);
        }
        
        public OrderSpecification(int id) : base(x => x.Id == id)
        {
            AddInclude("OrderItems");
            AddInclude("DeliveryMethod");
        }

        public static OrderStatus? ParseStatus(string? status)
        {
            if (Enum.TryParse<OrderStatus>(status, true, out var result))
            {
                return result;
            }
            else
            {
                return null;
            }
        }
    }
}