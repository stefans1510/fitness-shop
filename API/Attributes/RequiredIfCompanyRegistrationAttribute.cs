using System.ComponentModel.DataAnnotations;

namespace API.Attributes
{
    public class RequiredIfCompanyRegistrationAttribute : ValidationAttribute
    {
        public RequiredIfCompanyRegistrationAttribute()
        {
            ErrorMessage = "Company registration code is required for legal entity registration.";
        }

        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            var instance = validationContext.ObjectInstance;
            var isCompanyRegistrationProperty = instance.GetType().GetProperty("IsCompanyRegistration");
            
            if (isCompanyRegistrationProperty != null)
            {
                var isCompanyRegistration = (bool)(isCompanyRegistrationProperty.GetValue(instance) ?? false);
                
                if (isCompanyRegistration)
                {
                    if (value == null || string.IsNullOrWhiteSpace(value.ToString()))
                    {
                        return new ValidationResult(ErrorMessage);
                    }
                    
                    // Additional validation for company code format
                    string code = value.ToString() ?? "";
                    
                    if (code.Length < 6 || code.Length > 20)
                    {
                        return new ValidationResult("Company code must be between 6 and 20 characters.");
                    }
                    
                    if (!code.All(char.IsLetterOrDigit))
                    {
                        return new ValidationResult("Company code can only contain letters and numbers.");
                    }
                }
            }
            
            return ValidationResult.Success;
        }
    }
}
