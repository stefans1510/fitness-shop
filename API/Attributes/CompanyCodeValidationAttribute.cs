using System.ComponentModel.DataAnnotations;

namespace API.Attributes
{
    public class CompanyCodeValidationAttribute : ValidationAttribute
    {
        public CompanyCodeValidationAttribute()
        {
            ErrorMessage = "Company code must be 6-20 alphanumeric characters.";
        }

        public override bool IsValid(object? value)
        {
            if (value == null) return true; // Let [Required] handle null validation
            
            string code = value.ToString() ?? "";
            
            // Check length (6-20 characters)
            if (code.Length < 6 || code.Length > 20) return false;
            
            // Check if alphanumeric only
            return code.All(char.IsLetterOrDigit);
        }
    }
}
