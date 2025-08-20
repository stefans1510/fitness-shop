using Core.Entities;
using Core.Interfaces;
using Core.Specifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController(IUnitOfWork unitOfWork) : BaseApiController
    {

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<Product>>> GetProducts(
            [FromQuery]ProductSpecificationParameters specificationParameters
        )
        {
            var specification = new ProductSpecification(specificationParameters);

            return await CreatePagedResult(unitOfWork.Repository<Product>(), specification,
                specificationParameters.PageIndex, specificationParameters.PageSize
            );
        }

        [HttpGet("{id:int}")] // api/products/1
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            var product = await unitOfWork.Repository<Product>().GetByIdAsync(id);

            if (product == null) return NotFound();

            return product;
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<Product>> CreateProduct(Product product)
        {
            unitOfWork.Repository<Product>().Add(product);

            if (await unitOfWork.Complete())
            {
                return CreatedAtAction("GetProduct", new { id = product.Id }, product);
            }

            return BadRequest("Problem creating product");
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id:int}")]
        public async Task<ActionResult> UpdateProduct(int id, Product product)
        {
            if (product.Id != id || !ProductExists(id))
                return BadRequest("Cannot update this produt");

            unitOfWork.Repository<Product>().Update(product);

            if (await unitOfWork.Complete())
            {
                return NoContent();
            }
            
            return BadRequest("Problem updating product");
        }
        
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id:int}")]
        public async Task<ActionResult> DeleteProduct(int id)
        {
            var product = await unitOfWork.Repository<Product>().GetByIdAsync(id);

            if (product == null) return NotFound();

            unitOfWork.Repository<Product>().Remove(product);

            if (await unitOfWork.Complete())
            {
                return NoContent();
            }
            
            return BadRequest("Problem deleting product");
        }

        [HttpGet("brands")]
        public async Task<ActionResult<IReadOnlyList<string>>> GetBrands()
        {
            var specification = new BrandListSpecification();

            return Ok(await unitOfWork.Repository<Product>().ListAsync(specification));
        }

        [HttpGet("types")]
        public async Task<ActionResult<IReadOnlyList<string>>> GetTypes()
        {
            var specification = new TypeListSpecification();

            return Ok(await unitOfWork.Repository<Product>().ListAsync(specification));
        }

        private bool ProductExists(int id)
        {
            return unitOfWork.Repository<Product>().Exists(id);
        }
    }
}