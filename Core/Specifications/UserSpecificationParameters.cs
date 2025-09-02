namespace Core.Specifications;

public class UserSpecificationParameters : PagingParameters
{
    public string? Search { get; set; }
    public string? Role { get; set; }
}
