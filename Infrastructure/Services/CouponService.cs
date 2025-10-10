using Core.Entities;
using Core.Interfaces;

namespace Infrastructure.Services
{
    public class CouponService : ICouponService
    {
        private readonly IUnitOfWork unitOfWork;

        public CouponService(IUnitOfWork unitOfWork)
        {
            this.unitOfWork = unitOfWork;
        }

        public async Task<Coupon?> GetCouponByCodeAsync(string code)
        {
            var coupons = await unitOfWork.Repository<Coupon>().ListAllAsync();
            return coupons.FirstOrDefault(c => c.Code.ToUpper() == code.ToUpper());
        }

        public async Task<bool> ValidateCouponAsync(string code, string userId, decimal orderAmount)
        {
            var coupon = await GetCouponByCodeAsync(code);
            
            if (coupon == null) return false;
            
            // Check if coupon is active
            if (!coupon.IsActive) return false;
            
            // Check validity dates
            var now = DateTime.UtcNow;
            if (now < coupon.ValidFrom || now > coupon.ValidUntil) return false;
            
            // Check minimum order amount
            if (coupon.MinimumOrderAmount.HasValue && orderAmount < coupon.MinimumOrderAmount.Value)
                return false;
            
            // Check usage limit
            if (coupon.UsageLimit.HasValue && coupon.UsageCount >= coupon.UsageLimit.Value)
                return false;
            
            // Check if user has already used this coupon
            var userUsageCount = await GetCouponUsageCountAsync(code, userId);
            if (userUsageCount > 0) return false; // Each user can use a coupon only once
            
            return true;
        }

        public async Task<decimal> CalculateDiscountAsync(string code, decimal orderAmount)
        {
            var coupon = await GetCouponByCodeAsync(code);
            
            if (coupon == null) return 0;
            
            decimal discount = 0;
            
            if (coupon.Type == CouponType.Percentage)
            {
                discount = (orderAmount * coupon.Value) / 100;
                
                // Apply maximum discount limit if specified
                if (coupon.MaximumDiscountAmount.HasValue && 
                    discount > coupon.MaximumDiscountAmount.Value)
                {
                    discount = coupon.MaximumDiscountAmount.Value;
                }
            }
            else if (coupon.Type == CouponType.FixedAmount)
            {
                discount = coupon.Value;
                
                // Ensure discount doesn't exceed order amount
                if (discount > orderAmount)
                {
                    discount = orderAmount;
                }
            }
            
            return discount;
        }

        public async Task<Coupon> CreateCouponAsync(Coupon coupon)
        {
            // Check if coupon code already exists
            var existingCoupon = await GetCouponByCodeAsync(coupon.Code);
            if (existingCoupon != null)
            {
                throw new InvalidOperationException($"Coupon with code '{coupon.Code}' already exists");
            }
            
            coupon.CreatedAt = DateTime.UtcNow;
            coupon.UsageCount = 0;
            
            unitOfWork.Repository<Coupon>().Add(coupon);
            await unitOfWork.Complete();
            
            return coupon;
        }

        public async Task<bool> UseCouponAsync(string couponCode, string userId, string orderId, decimal discountAmount)
        {
            var coupon = await GetCouponByCodeAsync(couponCode);
            
            if (coupon == null) return false;
            
            // Create usage record
            var usage = new CouponUsage
            {
                CouponId = coupon.Id,
                UserId = userId,
                OrderId = orderId,
                DiscountAmount = discountAmount,
                UsedAt = DateTime.UtcNow
            };
            
            unitOfWork.Repository<CouponUsage>().Add(usage);
            
            // Increment usage count
            coupon.UsageCount++;
            unitOfWork.Repository<Coupon>().Update(coupon);
            
            await unitOfWork.Complete();
            
            return true;
        }

        public async Task<IEnumerable<Coupon>> GetActiveCouponsAsync()
        {
            var coupons = await unitOfWork.Repository<Coupon>().ListAllAsync();
            var now = DateTime.UtcNow;
            
            return coupons.Where(c => 
                c.IsActive && 
                c.ValidFrom <= now && 
                c.ValidUntil >= now &&
                (!c.UsageLimit.HasValue || c.UsageCount < c.UsageLimit.Value))
                .ToList();
        }

        public async Task<IEnumerable<Coupon>> GetUserCouponsAsync(string userId, bool isCompanyUser, bool isAdmin = false)
        {
            var activeCoupons = await GetActiveCouponsAsync();
            
            // Filter based on user type:
            // - Customer-only coupons are only available to regular customers (not company users, not admins)
            // - Regular coupons are available to everyone
            // - Admins can see all coupons for testing purposes
            if (isAdmin)
            {
                return activeCoupons.ToList(); // Admins can see all coupons
            }
            
            var isCustomer = !isCompanyUser && !isAdmin;
            var userTypeCoupons = activeCoupons.Where(c => !c.IsCustomerOnly || isCustomer);
            
            // Filter out coupons that the user has already used
            if (!string.IsNullOrEmpty(userId))
            {
                // Get all coupon usages for this user
                var allCouponUsages = await unitOfWork.Repository<CouponUsage>().ListAllAsync();
                var usedCouponIds = allCouponUsages
                    .Where(u => u.UserId == userId)
                    .Select(u => u.CouponId)
                    .ToHashSet();
                
                // Exclude coupons that the user has already used
                userTypeCoupons = userTypeCoupons.Where(c => !usedCouponIds.Contains(c.Id));
            }
            
            return userTypeCoupons.ToList();
        }

        public async Task<bool> DeactivateCouponAsync(int couponId)
        {
            var coupon = await unitOfWork.Repository<Coupon>().GetByIdAsync(couponId);
            
            if (coupon == null) return false;
            
            coupon.IsActive = false;
            unitOfWork.Repository<Coupon>().Update(coupon);
            await unitOfWork.Complete();
            
            return true;
        }

        public async Task<bool> ActivateCouponAsync(int couponId)
        {
            var coupon = await unitOfWork.Repository<Coupon>().GetByIdAsync(couponId);
            
            if (coupon == null) return false;
            
            coupon.IsActive = true;
            unitOfWork.Repository<Coupon>().Update(coupon);
            await unitOfWork.Complete();
            
            return true;
        }

        public async Task<bool> DeleteCouponAsync(int couponId)
        {
            var coupon = await unitOfWork.Repository<Coupon>().GetByIdAsync(couponId);
            
            if (coupon == null) return false;
            
            // Check if coupon has been used
            var usages = await unitOfWork.Repository<CouponUsage>().ListAllAsync();
            var hasUsages = usages.Any(u => u.CouponId == couponId);
            
            if (hasUsages)
            {
                throw new InvalidOperationException("Cannot delete coupon that has been used. Consider deactivating it instead.");
            }
            
            unitOfWork.Repository<Coupon>().Remove(coupon);
            await unitOfWork.Complete();
            
            return true;
        }

        public async Task<IEnumerable<Coupon>> GetAllCouponsAsync()
        {
            return await unitOfWork.Repository<Coupon>().ListAllAsync();
        }

        public async Task<Coupon?> GetCouponByIdAsync(int id)
        {
            return await unitOfWork.Repository<Coupon>().GetByIdAsync(id);
        }

        public async Task<Coupon> UpdateCouponAsync(Coupon coupon)
        {
            var existingCoupon = await unitOfWork.Repository<Coupon>().GetByIdAsync(coupon.Id);
            
            if (existingCoupon == null)
            {
                throw new InvalidOperationException("Coupon not found");
            }
            
            // Check if code is being changed and if new code already exists
            if (existingCoupon.Code.ToUpper() != coupon.Code.ToUpper())
            {
                var existingWithSameCode = await GetCouponByCodeAsync(coupon.Code);
                if (existingWithSameCode != null)
                {
                    throw new InvalidOperationException($"Coupon with code '{coupon.Code}' already exists");
                }
            }
            
            // Update properties
            existingCoupon.Code = coupon.Code.ToUpper();
            existingCoupon.Description = coupon.Description;
            existingCoupon.Type = coupon.Type;
            existingCoupon.Value = coupon.Value;
            existingCoupon.MinimumOrderAmount = coupon.MinimumOrderAmount;
            existingCoupon.MaximumDiscountAmount = coupon.MaximumDiscountAmount;
            existingCoupon.ValidFrom = coupon.ValidFrom;
            existingCoupon.ValidUntil = coupon.ValidUntil;
            existingCoupon.UsageLimit = coupon.UsageLimit;
            existingCoupon.IsCustomerOnly = coupon.IsCustomerOnly;
            
            unitOfWork.Repository<Coupon>().Update(existingCoupon);
            await unitOfWork.Complete();
            
            return existingCoupon;
        }

        public async Task<int> GetCouponUsageCountAsync(string couponCode, string? userId = null)
        {
            var coupon = await GetCouponByCodeAsync(couponCode);
            
            if (coupon == null) return 0;
            
            var usages = await unitOfWork.Repository<CouponUsage>().ListAllAsync();
            
            if (string.IsNullOrEmpty(userId))
            {
                // Return total usage count for the coupon
                return usages.Count(u => u.CouponId == coupon.Id);
            }
            else
            {
                // Return usage count for specific user
                return usages.Count(u => u.CouponId == coupon.Id && u.UserId == userId);
            }
        }

        public async Task<bool> ReleaseCouponAsync(string orderId)
        {
            // Find coupon usage for this order
            var couponUsages = await unitOfWork.Repository<CouponUsage>().ListAllAsync();
            var usage = couponUsages.FirstOrDefault(u => u.OrderId == orderId);
            
            if (usage == null) return false; // No coupon was used for this order
            
            // Get the coupon to check if it's still valid
            var coupon = await unitOfWork.Repository<Coupon>().GetByIdAsync(usage.CouponId);
            if (coupon == null) return false;
            
            // Only release the coupon if it's still active and valid
            var now = DateTime.UtcNow;
            bool isCouponStillValid = coupon.IsActive && 
                                     now >= coupon.ValidFrom && 
                                     now <= coupon.ValidUntil;
            
            // Always remove the usage record (cleanup)
            unitOfWork.Repository<CouponUsage>().Remove(usage);
            
            // Only decrement usage count if coupon is still valid for future use
            if (isCouponStillValid)
            {
                coupon.UsageCount = Math.Max(0, coupon.UsageCount - 1);
                unitOfWork.Repository<Coupon>().Update(coupon);
            }
            
            await unitOfWork.Complete();
            
            return true;
        }
    }
}