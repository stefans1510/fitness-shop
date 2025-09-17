using Core.Entities;

namespace Core.Interfaces
{
    public interface IInventoryService
    {
        Task<bool> CheckStockAvailability(int productId, int requestedQuantity);
        Task<bool> ReserveStock(List<CartItem> items, string reservationId);
        Task<bool> CommitReservedStock(string reservationId);
        Task<bool> ReleaseReservedStock(string reservationId);
        Task<int> GetAvailableStock(int productId);
    }
}
