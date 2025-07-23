using Core.Entities;
using Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Stripe;

namespace Infrastructure.Services
{
    public class PaymentService(
        IConfiguration configuration,
        IShoppingCartService shoppingCartService,
        IUnitOfWork unitOfWork
    ) : IPaymentService
    {
        public async Task<ShoppingCart?> CreateOrUpdatePaymentIntent(string shoppingCartId)
        {
            StripeConfiguration.ApiKey = configuration["StripeSettings:SecretKey"];

            var shoppingCart = await shoppingCartService.GetShoppingCartAsync(shoppingCartId);

            if (shoppingCart == null) return null;

            var shippingPrice = 0m;

            if (shoppingCart.DeliveryMethodId.HasValue)
            {
                var deliveryMethod = await unitOfWork.Repository<DeliveryMethod>()
                    .GetByIdAsync((int)shoppingCart.DeliveryMethodId);

                if (deliveryMethod == null) return null;

                shippingPrice = deliveryMethod.Price;
            }

            foreach (var item in shoppingCart.Items)
            {
                var productItem = await unitOfWork.Repository<Core.Entities.Product>()
                    .GetByIdAsync(item.ProductId);

                if (productItem == null) return null;

                if (item.Price != productItem.Price)
                {
                    item.Price = productItem.Price;
                }
            }

            var service = new PaymentIntentService();
            PaymentIntent? intent = null;

            if (string.IsNullOrEmpty(shoppingCart.PaymentIntentId))
            {
                var options = new PaymentIntentCreateOptions
                {
                    Amount = (long)shoppingCart.Items.Sum(x =>
                        x.Quantity * (x.Price * 100)) + (long)shippingPrice * 100,
                    Currency = "usd",
                    PaymentMethodTypes = ["card"]
                };
                intent = await service.CreateAsync(options);
                shoppingCart.PaymentIntentId = intent.Id;
                shoppingCart.ClientSecret = intent.ClientSecret;
            }
            else
            {
                var options = new PaymentIntentUpdateOptions
                {
                    Amount = (long)shoppingCart.Items.Sum(x =>
                        x.Quantity * (x.Price * 100)) + (long)shippingPrice * 100
                };
                intent = await service.UpdateAsync(shoppingCart.PaymentIntentId, options);
            }

            await shoppingCartService.SetShoppingCartAsync(shoppingCart);

            return shoppingCart;
        }
    }
}