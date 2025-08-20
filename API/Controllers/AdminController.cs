using API.DTOs;
using API.Extensions;
using Core.Entities.OrderAggregate;
using Core.Interfaces;
using Core.Specifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Authorize(Roles = "Admin")]
    public class AdminController(
        IUnitOfWork unitOfWork,
        IPaymentService paymentService
    ) : BaseApiController
    {

        [HttpGet("orders")]
        public async Task<ActionResult<IReadOnlyList<OrderDto>>> GetOrders(
            [FromQuery] OrderSpecificationParameters orerSpecParams
        )
        {
            var specification = new OrderSpecification(orerSpecParams);

            return await CreatePagedResult(
                unitOfWork.Repository<Order>(),
                specification,
                orerSpecParams.PageIndex,
                orerSpecParams.PageSize,
                o => o.ToDto()
            );
        }

        [HttpGet("orders/{id:int}")]
        public async Task<ActionResult<OrderDto>> GetOrder(int id)
        {
            var specification = new OrderSpecification(id);

            var order = await unitOfWork.Repository<Order>().GetEntityWithSpecification(specification);

            if (order == null) return BadRequest("No order found");

            return order.ToDto();
        }

        [HttpPost("orders/refund/{id:int}")]
        public async Task<ActionResult<OrderDto>> RefundOrder(int id)
        {
            var specification = new OrderSpecification(id);
            var order = await unitOfWork.Repository<Order>().GetEntityWithSpecification(specification);

            if (order == null) return BadRequest("No order found");

            if (order.Status == OrderStatus.Pending)
                return BadRequest("Payment not received for this order");

            var result = await paymentService.RefundPayment(order.PaymentIntentId);

            if (result == "succeeded")
            {
                order.Status = OrderStatus.Refunded;

                await unitOfWork.Complete();

                return order.ToDto();
            }

            return BadRequest("Problem refunding order");
        }
    }
}