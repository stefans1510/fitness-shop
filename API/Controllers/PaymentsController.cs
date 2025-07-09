using Core.Entities;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    public class PaymentsController(
        IPaymentService paymentService,
        IGenericRepository<DeliveryMethod> deliveryMethodRepository
    ) : BaseApiController
    {
        [Authorize]
        [HttpPost("{shoppingCartId}")]
        public async Task<ActionResult<ShoppingCart>> CreateOrUpdatePaymentIntent(string shoppingCartId)
        {
            var shoppingCart = await paymentService.CreateOrUpdatePaymentIntent(shoppingCartId);

            if (shoppingCart == null) return BadRequest("Problem with your cart");

            return Ok(shoppingCart);
        }

        [HttpGet("delivery-methods")]
        public async Task<ActionResult<IReadOnlyList<DeliveryMethod>>> GetDeliveryMethods()
        {
            return Ok(await deliveryMethodRepository.ListAllAsync());
        }
    }
}