using API.DTOs;
using Core.Entities;

namespace API.Extensions
{
    public static class ProductMappingExtensions
    {
        public static ProductDto ToDto(this Product product, bool isCompanyUser = false)
        {
            const decimal companyDiscountPercentage = 0.15m; // 15% discount
            
            var dto = new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                Price = product.Price,
                PictureUrl = product.PictureUrl,
                Type = product.Type,
                Brand = product.Brand,
                QuantityInStock = product.QuantityInStock,
                HasDiscount = isCompanyUser
            };

            if (isCompanyUser)
            {
                dto.DiscountedPrice = product.Price * (1 - companyDiscountPercentage);
            }

            return dto;
        }

        public static IEnumerable<ProductDto> ToDto(this IEnumerable<Product> products, bool isCompanyUser = false)
        {
            return products.Select(p => p.ToDto(isCompanyUser));
        }
    }
}
