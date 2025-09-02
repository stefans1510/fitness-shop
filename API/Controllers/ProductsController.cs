using Core.Entities;
using Core.Interfaces;
using Core.Specifications;
using Microsoft.AspNetCore.Mvc;
using API.DTOs;
using API.Extensions;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using API.RequestHelpers;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController(IUnitOfWork unitOfWork, UserManager<AppUser> userManager) : BaseApiController
    {
        private async Task<bool> IsCompanyUserAsync()
        {
            if (User.Identity?.IsAuthenticated != true) return false;
            
            var email = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(email)) return false;
            
            var user = await userManager.FindByEmailAsync(email);
            return user?.IsCompanyUser ?? false;
        }

        [HttpGet]
        public async Task<ActionResult> GetProducts(
            [FromQuery]ProductSpecificationParameters specificationParameters
        )
        {
            var specification = new ProductSpecification(specificationParameters);
            var isCompanyUser = await IsCompanyUserAsync();

            var items = await unitOfWork.Repository<Product>().ListAsync(specification);
            var count = await unitOfWork.Repository<Product>().CountAsync(specification);
            
            // Convert the products to DTOs with company discounts if applicable
            var productDtos = items.Select(p => p.ToDto(isCompanyUser)).ToList();
            var pagination = new Pagination<ProductDto>(specificationParameters.PageIndex, 
                specificationParameters.PageSize, count, productDtos);
            
            return Ok(pagination);
        }

        [HttpGet("{id:int}")] // api/products/1
        public async Task<ActionResult<ProductDto>> GetProduct(int id)
        {
            var product = await unitOfWork.Repository<Product>().GetByIdAsync(id);

            if (product == null) return NotFound();

            var isCompanyUser = await IsCompanyUserAsync();
            return product.ToDto(isCompanyUser);
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