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
        IHubContext<NotificationHub> hubContext,
        IInventoryService inventoryService
    ) : BaseApiController
    {
        private readonly string _webhookSecret = configuration["StripeSettings:WhSecret"]!;

        [Authorize]
        [HttpPost("{shoppingCartId}")]
        public async Task<ActionResult<ShoppingCart>> CreateOrUpdatePaymentIntent(string shoppingCartId)
        {
            try
            {
                var shoppingCart = await paymentService.CreateOrUpdatePaymentIntent(shoppingCartId);

                if (shoppingCart == null) 
                {
                    logger.LogWarning("Failed to create/update payment intent for cart {CartId}", shoppingCartId);
                    return BadRequest(new { 
                        message = "Your cart has expired or is no longer valid. Please refresh the page and add items to your cart again.",
                        code = "CART_EXPIRED" 
                    });
                }

                return Ok(shoppingCart);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error creating payment intent for cart {CartId}", shoppingCartId);
                return BadRequest(new { 
                    message = "Unable to process payment. Please try again or contact support if the problem persists.",
                    code = "PAYMENT_ERROR" 
                });
            }
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

                if (stripeEvent.Type == "payment_intent.succeeded")  // handle the payment_intent.succeeded event
                {
                    if (stripeEvent.Data.Object is PaymentIntent intent)
                    {
                        logger.LogInformation("Processing payment_intent.succeeded for payment intent {PaymentIntentId}", intent.Id);
                        await HandlePaymentIntentSucceeded(intent);
                    }
                    else
                    {
                        logger.LogWarning("Received payment_intent.succeeded event but could not cast to PaymentIntent");
                        return BadRequest("Invalid PaymentIntent data");
                    }
                }
                else
                {   
                    logger.LogInformation("Received Stripe event of type {EventType}, ignoring", stripeEvent.Type);  // log other event types but don't process them
                }

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
                    .GetEntityWithSpecification(specification);

                if (order == null)
                {
                    logger.LogWarning("Order not found for payment intent {PaymentIntentId}. This might be expected if the order hasn't been created yet.", intent.Id);
                    // Order might be created shortly after payment, this is normal
                    return;
                }

                if ((long)order.GetTotal() * 100 != intent.Amount)
                {
                    logger.LogWarning("Payment amount mismatch - Order: {OrderTotal}, Intent: {IntentAmount}", 
                        order.GetTotal(), intent.Amount / 100m);
                    order.Status = OrderStatus.PaymentMissmatch;
                    // Release reserved stock for payment mismatch
                    await inventoryService.ReleaseReservedStock(intent.Id);
                }
                else
                {
                    // Update status (might already be PaymentReceived if order was created after payment)
                    order.Status = OrderStatus.PaymentReceived;
                    
                    // Commit reserved stock - this will reduce actual inventory
                    // This is safe to call multiple times for the same payment intent
                    var stockCommitted = await inventoryService.CommitReservedStock(intent.Id);
                    if (!stockCommitted)
                    {
                        logger.LogError("Failed to commit stock for order {OrderId}, payment intent {PaymentIntentId}", 
                            order.Id, intent.Id);
                        // Consider how to handle this - maybe set order status to a special state
                    }
                }

                await unitOfWork.Complete();

                var connectionId = NotificationHub.GetConnectionIdByEmail(order.BuyerEmail);
                logger.LogInformation("Attempting to send SignalR notification for order {OrderId} to email {Email}, connection ID: {ConnectionId}", 
                    order.Id, order.BuyerEmail, connectionId ?? "null");

                if (!string.IsNullOrEmpty(connectionId))
                {
                    await hubContext.Clients.Client(connectionId)
                        .SendAsync("OrderCompleteNotification", order.ToDto());  //DTO for checkout success page
                    logger.LogInformation("SignalR notification sent successfully for order {OrderId}", order.Id);
                }
                else
                {
                    logger.LogWarning("No SignalR connection found for email {Email}, order {OrderId}", order.BuyerEmail, order.Id);
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