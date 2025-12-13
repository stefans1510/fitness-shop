using Core.Entities;
using Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Stripe;

namespace Infrastructure.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IConfiguration configuration;
        private readonly IShoppingCartService shoppingCartService;
        private readonly IUnitOfWork unitOfWork;
        private readonly ICouponService couponService;

        public PaymentService(
            IConfiguration configuration,
            IShoppingCartService shoppingCartService,
            IUnitOfWork unitOfWork,
            ICouponService couponService
        )
        {
            this.configuration = configuration;
            this.shoppingCartService = shoppingCartService;
            this.unitOfWork = unitOfWork;
            this.couponService = couponService;
        }

        public async Task<ShoppingCart?> CreateOrUpdatePaymentIntent(string shoppingCartId)
        {
            StripeConfiguration.ApiKey = configuration["StripeSettings:SecretKey"];
            
            var shoppingCart = await shoppingCartService.GetShoppingCartAsync(shoppingCartId)
                ?? throw new Exception("Cart unavailable");
            
            var shippingPrice = await GetShippingPriceAsync(shoppingCart) ?? 0;
            await ValidateCartItemsAsync(shoppingCart);
            
            var subtotal = CalculateSubtotal(shoppingCart);
            
            // Apply discount if coupon is present
            if (!string.IsNullOrEmpty(shoppingCart.CouponCode))
            {
                subtotal = await ApplyDiscountAsync(shoppingCart.CouponCode, subtotal);
            }
            
            var total = subtotal + shippingPrice;
            await CreateUpdatePaymentIntentAsync(shoppingCart, total);
            await shoppingCartService.SetShoppingCartAsync(shoppingCart);
            
            return shoppingCart;
        }

        private async Task CreateUpdatePaymentIntentAsync(ShoppingCart cart, long total)
        {
            var service = new PaymentIntentService();
            
            if (string.IsNullOrEmpty(cart.PaymentIntentId))
            {
                var options = new PaymentIntentCreateOptions
                {
                    Amount = total,
                    Currency = "usd",
                    PaymentMethodTypes = ["card"]
                };
                var intent = await service.CreateAsync(options);
                cart.PaymentIntentId = intent.Id;
                cart.ClientSecret = intent.ClientSecret;
            }
            else
            {
                var options = new PaymentIntentUpdateOptions
                {
                    Amount = total
                };
                await service.UpdateAsync(cart.PaymentIntentId, options);
            }
        }

        private async Task<long> ApplyDiscountAsync(string couponCode, long amount)
        {
            // Get the discount amount in cents
            var discountAmountDecimal = await couponService.CalculateDiscountAsync(couponCode, amount / 100m);
            var discountAmountCents = (long)(discountAmountDecimal * 100);
            
            // Ensure we don't go below minimum Stripe amount (50 cents)
            var discountedAmount = Math.Max(amount - discountAmountCents, 50);
            
            return discountedAmount;
        }

        private long CalculateSubtotal(ShoppingCart cart)
        {
            var itemTotal = cart.Items.Sum(x => x.Quantity * x.Price * 100);
            return (long)itemTotal;
        }

        private async Task ValidateCartItemsAsync(ShoppingCart cart)
        {
            foreach (var item in cart.Items)
            {
                var productItem = await unitOfWork.Repository<Core.Entities.Product>()
                    .GetByIdAsync(item.ProductId)
                    ?? throw new Exception("Problem getting product in cart");
                
                // Calculate what the company discounted price would be (15% off)
                const decimal companyDiscountPercentage = 0.15m;
                var companyPrice = productItem.Price * (1 - companyDiscountPercentage);
                
                // Check if current cart price matches either regular price or company price
                var matchesRegularPrice = Math.Abs(item.Price - productItem.Price) <= 0.01m;
                var matchesCompanyPrice = Math.Abs(item.Price - companyPrice) <= 0.01m;

                if (!matchesRegularPrice && !matchesCompanyPrice)
                {
                    item.Price = productItem.Price;
                }
            }
        }

        private async Task<long?> GetShippingPriceAsync(ShoppingCart cart)
        {
            if (cart.DeliveryMethodId.HasValue)
            {
                var deliveryMethod = await unitOfWork.Repository<DeliveryMethod>()
                    .GetByIdAsync((int)cart.DeliveryMethodId)
                    ?? throw new Exception("Problem with delivery method");
                
                return (long)(deliveryMethod.Price * 100);
            }
            return null;
        }

        public async Task<string> RefundPayment(string paymentIntentId)
        {
            StripeConfiguration.ApiKey = configuration["StripeSettings:SecretKey"];
            
            var refundOptions = new RefundCreateOptions
            {
                PaymentIntent = paymentIntentId
            };

            var refundService = new RefundService();
            var result = await refundService.CreateAsync(refundOptions);

            return result.Status;
        }
    }
}