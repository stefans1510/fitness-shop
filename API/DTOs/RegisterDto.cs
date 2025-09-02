using System.ComponentModel.DataAnnotations;
using API.Attributes;

namespace API.DTOs
{
    public class RegisterDto
    {
        [Required]
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        [Required]
        public string Email { get; set; } = string.Empty;
        [Required]
        public string Password { get; set; } = string.Empty;
        
        // Company-specific fields
        [RequiredIfCompanyRegistration]
        public string? CompanyCode { get; set; }
        public bool IsCompanyRegistration { get; set; }
    }
}