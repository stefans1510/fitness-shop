using Microsoft.AspNetCore.Identity;

namespace Core.Entities
{
    public class AppUser : IdentityUser
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public Address? Address { get; set; }
        
        // Company-specific properties
        public string? CompanyCode { get; set; }
        public bool IsCompanyUser { get; set; }
    }
}