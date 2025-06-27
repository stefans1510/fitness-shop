using Core.Entities;
using Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    public class ShoppingCartController(IShoppingCartService cartService) : BaseApiController
    {
        [HttpGet]
        public async Task<ActionResult<ShoppingCart>> GetShoppingCartById(string id)
        {
            var cart = await cartService.GetShoppingCartAsync(id);

            return Ok(cart ?? new ShoppingCart { Id = id });
        }

        [HttpPost]
        public async Task<ActionResult<ShoppingCart>> UpdateShoppingCart(ShoppingCart cart)
        {
            var updatedCart = await cartService.SetShoppingCartAsync(cart);

            if (updatedCart == null) return BadRequest("Problem with cart");

            return updatedCart;
        }

        [HttpDelete]
        public async Task<ActionResult> DeleteShoppingCart(string id)
        {
            var result = await cartService.DeleteShoppingCartAsync(id);

            if (!result) return BadRequest("Problem deleting cart");

            return Ok();
        }
    }
}