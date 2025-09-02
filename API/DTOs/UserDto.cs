using API.Extensions;
using Core.Entities;

namespace API.DTOs
{
    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public AddressDto? Address { get; set; }
        public IList<string> Roles { get; set; } = new List<string>();
    }

    public static class UserMappingExtensions
    {
        public static UserDto ToDto(this AppUser user, IList<string>? roles = null)
        {
            return new UserDto
            {
                Id = user.Id,
                FirstName = user.FirstName ?? "",
                LastName = user.LastName ?? "",
                Email = user.Email ?? "",
                Address = user.Address?.ToDto(),
                Roles = roles ?? new List<string>()
            };
        }
    }
}
