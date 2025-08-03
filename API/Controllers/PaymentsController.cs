using API.Extensions;
using API.SignalR;
using Core.Entities;
using Core.Entities.OrderAggregate;
using Core.Interfaces;
using Core.Specifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Stripe;

namespace API.Controllers
{
    public class PaymentsController(
        IPaymentService paymentService,
        IUnitOfWork unitOfWork,
        ILogger<PaymentsController> logger,
        IConfiguration configuration,
        IHubContext<NotificationHub> hubContext
    ) : BaseApiController
    {
        private readonly string _webhookSecret = configuration["StripeSettings:WhSecret"]!;

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
            return Ok(await unitOfWork.Repository<DeliveryMethod>().ListAllAsync());
        }

        [HttpPost("webhook")]
        public async Task<IActionResult> StripeWebhook()
        {
            var json = await new StreamReader(Request.Body).ReadToEndAsync();

            try
            {
                var stripeEvent = ConstructStripeEvent(json);

                if (stripeEvent.Data.Object is not PaymentIntent intent)
                {
                    return BadRequest("Invalid event data");
                }

                await HandlePaymentIntentSucceeded(intent);

                return Ok();   //informing Stripe of event reception and handling by API
            }
            catch (StripeException ex)
            {
                logger.LogError(ex, "Stripe webhook error");
                return StatusCode(StatusCodes.Status500InternalServerError, "Stripe webhook error");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An unexpected error occurred");
                return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred");
            }
        }

        private async Task HandlePaymentIntentSucceeded(PaymentIntent intent)
        {
            if (intent.Status == "succeeded")
            {
                var specification = new OrderSpecification(intent.Id, true);
                var order = await unitOfWork.Repository<Core.Entities.OrderAggregate.Order>()
                    .GetEntityWithSpecification(specification)
                    ?? throw new Exception("Order not found");

                if ((long)order.GetTotal() * 100 != intent.Amount)
                {
                    order.Status = OrderStatus.PaymentMissmatch;
                }
                else
                {
                    order.Status = OrderStatus.PaymentReceived;
                }

                await unitOfWork.Complete();

                var connectionId = NotificationHub.GetConnectionIdByEmail(order.BuyerEmail);

                if (!string.IsNullOrEmpty(connectionId))
                {
                    await hubContext.Clients.Client(connectionId)
                        .SendAsync("OrderCompleteNotification", order.ToDto());  //DTO for checkout success page
                }
            }
        }

        private Event ConstructStripeEvent(string json)
        {
            try
            {
                return EventUtility.ConstructEvent(
                    json, Request.Headers["Stripe-Signature"], _webhookSecret, throwOnApiVersionMismatch: false
                );
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to construct Stripe event");
                throw new StripeException("Invalid signature");
            }
        }
    }
}