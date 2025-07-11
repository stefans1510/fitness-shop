using API.RequestHelpers;
using Core.Entities;
using Core.Interfaces;
using Core.Specifications;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController(IGenericRepository<Product> repo) : BaseApiController
    {

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<Product>>> GetProducts(
            [FromQuery]ProductSpecificationParameters specificationParameters
        )
        {
            var specification = new ProductSpecification(specificationParameters);

            return await CreatePagedResult(repo, specification,
                specificationParameters.PageIndex, specificationParameters.PageSize
            );
        }

        [HttpGet("{id:int}")] // api/products/1
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            var product = await repo.GetByIdAsync(id);

            if (product == null) return NotFound();

            return product;
        }

        [HttpPost]
        public async Task<ActionResult<Product>> CreateProduct(Product product)
        {
            repo.Add(product);

            if (await repo.SaveAllAsync())
            {
                return CreatedAtAction("GetProduct", new { id = product.Id }, product);
            }

            return BadRequest("Problem creating product");
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult> UpdateProduct(int id, Product product)
        {
            if (product.Id != id || !ProductExists(id))
                return BadRequest("Cannot update this produt");

            repo.Update(product);

            if (await repo.SaveAllAsync())
            {
                return NoContent();
            }
            
            return BadRequest("Problem updating product");
        }

        [HttpDelete("{id:int}")]
        public async Task<ActionResult> DeleteProduct(int id)
        {
            var product = await repo.GetByIdAsync(id);

            if (product == null) return NotFound();

            repo.Remove(product);

            if (await repo.SaveAllAsync())
            {
                return NoContent();
            }
            
            return BadRequest("Problem deleting product");
        }

        [HttpGet("brands")]
        public async Task<ActionResult<IReadOnlyList<string>>> GetBrands()
        {
            var specification = new BrandListSpecification();

            return Ok(await repo.ListAsync(specification));
        }

        [HttpGet("types")]
        public async Task<ActionResult<IReadOnlyList<string>>> GetTypes()
        {
            var specification = new TypeListSpecification();

            return Ok(await repo.ListAsync(specification));
        }

        private bool ProductExists(int id)
        {
            return repo.Exists(id);
        }
    }
}