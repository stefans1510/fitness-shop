using Core.Entities;

namespace Core.Specifications
{
    public class ProductSpecification : BaseSpecification<Product>
    {
        public ProductSpecification(ProductSpecificationParameters specificationParameters) : base(x =>
            (string.IsNullOrEmpty(specificationParameters.Search) || x.Name.ToLower().Contains(specificationParameters.Search)) &&
            (specificationParameters.Brands.Count == 0 || specificationParameters.Brands.Contains(x.Brand)) &&
            (specificationParameters.Types.Count == 0 || specificationParameters.Types.Contains(x.Type))
        )
        {
            ApplyPaging(
                specificationParameters.PageSize * (specificationParameters.PageIndex - 1),
                specificationParameters.PageSize
            );

            switch (specificationParameters.Sort)
            {
                case "priceAsc":
                    AddOrderBy(x => x.Price);
                    break;
                case "priceDesc":
                    AddOrderByDesc(x => x.Price);
                    break;
                default:
                    AddOrderBy(x => x.Name);
                    break;
            }
        }
    }
}