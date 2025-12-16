using API.DTOs;
using API.Extensions;
using Core.Entities;
using Core.Entities.OrderAggregate;
using Core.Interfaces;
using Core.Specifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Authorize]
    public class OrdersController(
        IShoppingCartService shoppingCartService,
        IUnitOfWork unitOfWork,
        IInventoryService inventoryService,
        ICouponService couponService
        ) : BaseApiController
    {
        [HttpPost]
        public async Task<ActionResult<Order>> CreateOrder(CreateOrderDto createOrderDto)
        {
            var email = User.GetEmail();
            var shoppingCart = await shoppingCartService.GetShoppingCartAsync(createOrderDto.CartId);

            if (shoppingCart == null) return BadRequest("Cart not found");

            if (shoppingCart.PaymentIntentId == null) return BadRequest("No payment intent for this order");

            // Reserve stock using Payment Intent ID as reservation ID
            var stockReserved = await inventoryService.ReserveStock(shoppingCart.Items, shoppingCart.PaymentIntentId);
            if (!stockReserved)
            {
                return BadRequest("Insufficient stock for one or more items in your cart");
            }

            var items = new List<OrderItem>();

            foreach (var item in shoppingCart.Items)
            {
                var productItem = await unitOfWork.Repository<Product>()
                    .GetByIdAsync(item.ProductId);

                if (productItem == null) 
                {
                    // Release reserved stock if product validation fails
                    await inventoryService.ReleaseReservedStock(shoppingCart.PaymentIntentId);
                    return BadRequest("Problem with the order");
                }

                var itemOrdered = new ProductItemOrdered
                {
                    ProductId = item.ProductId,
                    ProductName = item.ProductName,
                    PictureUrl = item.PictureUrl
                };

                var orderItem = new OrderItem
                {
                    ItemOrdered = itemOrdered,
                    Price = item.Price,  // Use the cart item price (which includes company discounts)
                    Quantity = item.Quantity
                };

                items.Add(orderItem);
            }

            var deliveryMethod = await unitOfWork.Repository<DeliveryMethod>()
                .GetByIdAsync(createOrderDto.DeliveryMethodId);

            if (deliveryMethod == null) return BadRequest("No delivery method selected");

            var subtotal = items.Sum(x => x.Price * x.Quantity);
            var discount = 0m;
            string? appliedCouponCode = null;

            // Apply coupon if provided
            if (!string.IsNullOrEmpty(createOrderDto.CouponCode))
            {
                var isValidCoupon = await couponService.ValidateCouponAsync(createOrderDto.CouponCode, email, subtotal);
                if (isValidCoupon)
                {
                    discount = await couponService.CalculateDiscountAsync(createOrderDto.CouponCode, subtotal);
                    appliedCouponCode = createOrderDto.CouponCode;
                }
            }

            // Check if payment has already been processed
            var paymentStatus = OrderStatus.Pending;
            try
            {
                var service = new Stripe.PaymentIntentService();
                var intent = await service.GetAsync(shoppingCart.PaymentIntentId);
                if (intent.Status == "succeeded")
                {
                    paymentStatus = OrderStatus.PaymentReceived;
                }
            }
            catch (Exception ex)
            {
                // Log error but don't fail order creation
                Console.WriteLine($"Failed to check payment status: {ex.Message}");
            }

            var order = new Order
            {
                OrderItems = items,
                DeliveryMethod = deliveryMethod,
                ShippingAddress = createOrderDto.ShippingAddress,
                Subtotal = subtotal,
                DiscountAmount = discount,
                AppliedCouponCode = appliedCouponCode,
                PaymentSummary = createOrderDto.PaymentSummary,
                PaymentIntentId = shoppingCart.PaymentIntentId,
                BuyerEmail = email,
                Status = paymentStatus
            };

            unitOfWork.Repository<Order>().Add(order);

            if (await unitOfWork.Complete())
            {
                // Record coupon usage after successful order creation
                if (!string.IsNullOrEmpty(appliedCouponCode) && discount > 0)
                {
                    await couponService.UseCouponAsync(appliedCouponCode, email, order.Id.ToString(), discount);
                }

                // If payment is already marked as received at this point, commit stock immediately.
                // CommitReservedStock is idempotent, so it's safe if the webhook also calls it later.
                if (paymentStatus == OrderStatus.PaymentReceived)
                {
                    await inventoryService.CommitReservedStock(shoppingCart.PaymentIntentId);
                }

                return order;
            }

            return BadRequest("Problem creating order");
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<OrderDto>>> GetOrdersForUser()
        {
            var specification = new OrderSpecification(User.GetEmail());
            var orders = await unitOfWork.Repository<Order>().ListAsync(specification);
            var ordersToReturn = orders.Select(o => o.ToDto()).ToList();

            return Ok(ordersToReturn);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<OrderDto>> GetOrderById(int id)
        {
            var specification = new OrderSpecification(User.GetEmail(), id);
            var order = await unitOfWork.Repository<Order>().GetEntityWithSpecification(specification);

            if (order == null) return NotFound();

            return order.ToDto();
        }
    }
}