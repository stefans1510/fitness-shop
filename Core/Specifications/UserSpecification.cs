using Core.Entities;

namespace Core.Specifications
{
    public class UserSpecification : BaseSpecification<AppUser>
    {
        public UserSpecification(UserSpecificationParameters userSpecParams) : base(x =>
            string.IsNullOrEmpty(userSpecParams.Search) || 
            (x.FirstName != null && x.FirstName.ToLower().Contains(userSpecParams.Search.ToLower())) ||
            (x.LastName != null && x.LastName.ToLower().Contains(userSpecParams.Search.ToLower())) ||
            (x.Email != null && x.Email.ToLower().Contains(userSpecParams.Search.ToLower()))
        )
        {
            ApplyPaging(
                userSpecParams.PageSize * (userSpecParams.PageIndex - 1),
                userSpecParams.PageSize
            );
            AddOrderBy(x => x.Email ?? string.Empty);
        }
    }
}
