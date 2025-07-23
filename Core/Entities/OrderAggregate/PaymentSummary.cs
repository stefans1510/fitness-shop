namespace Core.Entities.OrderAggregate
{
    public class PaymentSummary
    {
        public int Last4 { get; set; }  //Stripe format
        public required string Brand { get; set; }
        public int ExpMonth { get; set; }
        public int ExpYear { get; set; }
    }
}