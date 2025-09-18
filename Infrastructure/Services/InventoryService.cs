using Core.Entities;
using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services
{
    public class InventoryService : IInventoryService
    {
        private readonly ShopContext _context;
        private readonly ILogger<InventoryService> _logger;

        public InventoryService(ShopContext context, ILogger<InventoryService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<bool> CheckStockAvailability(int productId, int requestedQuantity)
        {
            var availableStock = await GetAvailableStock(productId);
            return availableStock >= requestedQuantity;
        }

        public async Task<int> GetAvailableStock(int productId)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null) return 0;

            // Get total reserved (non-committed and non-expired) quantity
            var reservedQuantity = await _context.StockReservations
                .Where(r => r.ProductId == productId 
                    && !r.IsCommitted 
                    && r.ExpiresAt > DateTime.UtcNow)
                .SumAsync(r => r.ReservedQuantity);

            return Math.Max(0, product.QuantityInStock - reservedQuantity);
        }

        public async Task<bool> ReserveStock(List<CartItem> items, string reservationId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            
            try
            {
                // Clean up expired reservations first
                await CleanupExpiredReservations();

                // Check if reservation already exists
                var existingReservations = await _context.StockReservations
                    .Where(r => r.ReservationId == reservationId)
                    .ToListAsync();

                if (existingReservations.Any())
                {
                    _logger.LogWarning("Reservation {ReservationId} already exists", reservationId);
                    return true; // Already reserved
                }

                // Check availability for all items
                foreach (var item in items)
                {
                    var availableStock = await GetAvailableStock(item.ProductId);
                    if (availableStock < item.Quantity)
                    {
                        _logger.LogWarning("Insufficient stock for product {ProductId}. Available: {Available}, Requested: {Requested}", 
                            item.ProductId, availableStock, item.Quantity);
                        return false;
                    }
                }

                // Create reservations
                var reservations = items.Select(item => new StockReservation
                {
                    ReservationId = reservationId,
                    ProductId = item.ProductId,
                    ReservedQuantity = item.Quantity,
                    ReservedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(30)
                }).ToList();

                _context.StockReservations.AddRange(reservations);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Successfully reserved stock for reservation {ReservationId}", reservationId);
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Failed to reserve stock for reservation {ReservationId}", reservationId);
                return false;
            }
        }

        public async Task<bool> CommitReservedStock(string reservationId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            
            try
            {
                var reservations = await _context.StockReservations
                    .Include(r => r.Product)
                    .Where(r => r.ReservationId == reservationId && !r.IsCommitted)
                    .ToListAsync();

                if (!reservations.Any())
                {
                    _logger.LogWarning("No uncommitted reservations found for {ReservationId}", reservationId);
                    return false;
                }

                // Reduce actual stock quantities
                foreach (var reservation in reservations)
                {
                    if (reservation.Product.QuantityInStock < reservation.ReservedQuantity)
                    {
                        _logger.LogError("Insufficient actual stock for product {ProductId} in reservation {ReservationId}", 
                            reservation.ProductId, reservationId);
                        return false;
                    }

                    reservation.Product.QuantityInStock -= reservation.ReservedQuantity;
                    reservation.IsCommitted = true;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Successfully committed stock for reservation {ReservationId}", reservationId);
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Failed to commit stock for reservation {ReservationId}", reservationId);
                return false;
            }
        }

        public async Task<bool> ReleaseReservedStock(string reservationId)
        {
            try
            {
                var reservations = await _context.StockReservations
                    .Where(r => r.ReservationId == reservationId && !r.IsCommitted)
                    .ToListAsync();

                if (reservations.Any())
                {
                    _context.StockReservations.RemoveRange(reservations);
                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation("Released stock reservations for {ReservationId}", reservationId);
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to release stock for reservation {ReservationId}", reservationId);
                return false;
            }
        }

        public async Task<Product?> GetProduct(int productId)
        {
            return await _context.Products.FindAsync(productId);
        }

        private async Task CleanupExpiredReservations()
        {
            var expiredReservations = await _context.StockReservations
                .Where(r => !r.IsCommitted && r.ExpiresAt <= DateTime.UtcNow)
                .ToListAsync();

            if (expiredReservations.Any())
            {
                _context.StockReservations.RemoveRange(expiredReservations);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Cleaned up {Count} expired reservations", expiredReservations.Count);
            }
        }
    }
}
