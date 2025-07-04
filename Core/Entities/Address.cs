namespace Core.Entities
{
    public class Address : BaseEntity
    {
        public required string Line1 { get; set; }  //address format compatible with Stripe
        public string? Line2 { get; set; }
        public required string City { get; set; }
        public required string State { get; set; }
        public required string PostalCode { get; set; }
        public required string Country { get; set; }
    }
}