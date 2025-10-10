using Core.Entities;

namespace Core.Interfaces
{
    public interface ICouponService
    {
        Task<Coupon?> GetCouponByCodeAsync(string code);
        Task<bool> ValidateCouponAsync(string code, string userId, decimal orderAmount);
        Task<decimal> CalculateDiscountAsync(string code, decimal orderAmount);
        Task<Coupon> CreateCouponAsync(Coupon coupon);
        Task<bool> UseCouponAsync(string couponCode, string userId, string orderId, decimal discountAmount);
        Task<IEnumerable<Coupon>> GetActiveCouponsAsync();
        Task<IEnumerable<Coupon>> GetUserCouponsAsync(string userId, bool isCompanyUser, bool isAdmin = false);
        Task<bool> DeactivateCouponAsync(int couponId);
        Task<bool> ActivateCouponAsync(int couponId);
        Task<bool> DeleteCouponAsync(int couponId);
        Task<IEnumerable<Coupon>> GetAllCouponsAsync();
        Task<Coupon?> GetCouponByIdAsync(int id);
        Task<Coupon> UpdateCouponAsync(Coupon coupon);
        Task<int> GetCouponUsageCountAsync(string couponCode, string? userId = null);
        Task<bool> ReleaseCouponAsync(string orderId);
    }
}