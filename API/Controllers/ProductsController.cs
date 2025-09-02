using Core.Entities;
using Core.Interfaces;
using Core.Specifications;
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
    }
}