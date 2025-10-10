using API.DTOs;
using API.Extensions;
using Core.Entities;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers
{
    public class CouponsController(
        ICouponService couponService,
        UserManager<AppUser> userManager
    ) : BaseApiController
    {
        // Helper method to check if user is company user
        private async Task<bool> IsCompanyUserAsync()
        {
            if (User.Identity?.IsAuthenticated != true) return false;
            
            var email = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(email)) return false;
            
            var user = await userManager.FindByEmailAsync(email);
            return user?.IsCompanyUser ?? false;
        }

        // Helper method to check if user is a regular customer (not company, not admin)
        private async Task<bool> IsCustomerUserAsync()
        {
            if (User.Identity?.IsAuthenticated != true) return false;
            
            var email = User.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(email)) return false;
            
            var user = await userManager.FindByEmailAsync(email);
            if (user == null) return false;
            
            // Check if user is not a company user and not an admin
            var isAdmin = await userManager.IsInRoleAsync(user, "Admin");
            return !user.IsCompanyUser && !isAdmin;
        }



        // User endpoints
        [Authorize]
        [HttpGet("available")]
        public async Task<ActionResult<IEnumerable<CouponDto>>> GetAvailableCoupons()
        {
            var userEmail = User.GetEmail();
            var isCompanyUser = await IsCompanyUserAsync();
            var isAdmin = User.IsInRole("Admin");
            
            var coupons = await couponService.GetUserCouponsAsync(userEmail, isCompanyUser, isAdmin);
            var couponDtos = coupons.Select(MapToDto);
            
            return Ok(couponDtos);
        }

        [HttpPost("validate")]
        public async Task<ActionResult> ValidateCoupon([FromBody] ValidateCouponRequest request)
        {
            var userEmail = User.Identity?.IsAuthenticated == true ? User.GetEmail() : string.Empty;
            
            // First check if coupon exists
            var coupon = await couponService.GetCouponByCodeAsync(request.Code);
            if (coupon == null)
            {
                return BadRequest(new { message = "Coupon code not found" });
            }

            // Then validate the coupon
            var isValid = await couponService.ValidateCouponAsync(request.Code, userEmail, request.OrderAmount);
            if (!isValid)
            {
                // Provide more specific error messages based on coupon status
                if (!coupon.IsActive)
                {
                    return BadRequest(new { message = "This coupon is no longer active" });
                }
                if (DateTime.UtcNow < coupon.ValidFrom)
                {
                    return BadRequest(new { message = "This coupon is not yet valid" });
                }
                if (DateTime.UtcNow > coupon.ValidUntil)
                {
                    return BadRequest(new { message = "This coupon has expired" });
                }
                if (coupon.MinimumOrderAmount.HasValue && request.OrderAmount < coupon.MinimumOrderAmount.Value)
                {
                    return BadRequest(new { message = $"Minimum order amount of ${coupon.MinimumOrderAmount.Value:F2} required for this coupon" });
                }
                if (coupon.IsCustomerOnly && !await IsCustomerUserAsync())
                {
                    return BadRequest(new { message = "This coupon is only available to regular customers" });
                }
                
                return BadRequest(new { message = "Coupon is not valid for this order" });
            }

            var discountAmount = await couponService.CalculateDiscountAsync(request.Code, request.OrderAmount);

            return Ok(new { 
                discount = discountAmount, 
                type = (int)coupon.Type 
            });
        }



        // Admin endpoints
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CouponDto>>> GetAllCoupons()
        {
            var coupons = await couponService.GetAllCouponsAsync(); // Show all coupons including inactive
            var couponDtos = coupons.Select(MapToDto);
            
            return Ok(couponDtos);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<CouponDto>> CreateCoupon([FromBody] CreateCouponDto createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var coupon = MapToEntity(createDto);
                var createdCoupon = await couponService.CreateCouponAsync(coupon);
                var couponDto = MapToDto(createdCoupon);

                return CreatedAtAction(nameof(GetCouponByCode), new { code = coupon.Code }, couponDto);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/deactivate")]
        public async Task<ActionResult> DeactivateCoupon(int id)
        {
            var result = await couponService.DeactivateCouponAsync(id);
            
            if (!result)
            {
                return NotFound(new { message = "Coupon not found" });
            }

            return Ok(new { message = "Coupon deactivated successfully" });
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}/activate")]
        public async Task<ActionResult> ActivateCoupon(int id)
        {
            var result = await couponService.ActivateCouponAsync(id);
            
            if (!result)
            {
                return NotFound(new { message = "Coupon not found" });
            }

            return Ok(new { message = "Coupon activated successfully" });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteCoupon(int id)
        {
            try
            {
                var result = await couponService.DeleteCouponAsync(id);
                
                if (!result)
                {
                    return NotFound(new { message = "Coupon not found" });
                }

                return Ok(new { message = "Coupon deleted successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("{id}")]
        public async Task<ActionResult<CouponDto>> GetCouponById(int id)
        {
            var coupon = await couponService.GetCouponByIdAsync(id);
            
            if (coupon == null)
            {
                return NotFound(new { message = "Coupon not found" });
            }

            return Ok(MapToDto(coupon));
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<ActionResult<CouponDto>> UpdateCoupon(int id, [FromBody] CreateCouponDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var couponToUpdate = MapToEntity(updateDto);
                couponToUpdate.Id = id;
                
                var updatedCoupon = await couponService.UpdateCouponAsync(couponToUpdate);
                var couponDto = MapToDto(updatedCoupon);

                return Ok(couponDto);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("{couponCode}/usage")]
        public async Task<ActionResult> GetCouponUsageStats(string couponCode)
        {
            var totalUsage = await couponService.GetCouponUsageCountAsync(couponCode);
            var coupon = await couponService.GetCouponByCodeAsync(couponCode);
            
            if (coupon == null)
            {
                return NotFound(new { message = "Coupon not found" });
            }

            return Ok(new 
            { 
                totalUsage,
                usageLimit = coupon.UsageLimit,
                remainingUses = coupon.UsageLimit.HasValue ? coupon.UsageLimit.Value - totalUsage : (int?)null
            });
        }

        [HttpGet("code/{code}")]
        public async Task<ActionResult<CouponDto>> GetCouponByCode(string code)
        {
            var coupon = await couponService.GetCouponByCodeAsync(code);
            
            if (coupon == null)
            {
                return NotFound();
            }

            return Ok(MapToDto(coupon));
        }

        // Helper mapping methods
        private static CouponDto MapToDto(Coupon coupon)
        {
            return new CouponDto
            {
                Id = coupon.Id,
                Code = coupon.Code,
                Description = coupon.Description,
                Type = coupon.Type.ToString(),
                Value = coupon.Value,
                MinimumOrderAmount = coupon.MinimumOrderAmount,
                MaximumDiscountAmount = coupon.MaximumDiscountAmount,
                ValidFrom = coupon.ValidFrom,
                ValidUntil = coupon.ValidUntil,
                UsageLimit = coupon.UsageLimit,
                UsageCount = coupon.UsageCount,
                IsActive = coupon.IsActive,
                CreatedAt = coupon.CreatedAt,
                IsCustomerOnly = coupon.IsCustomerOnly
            };
        }
        
        private static Coupon MapToEntity(CreateCouponDto dto)
        {
            return new Coupon
            {
                Code = dto.Code.ToUpper(), // Store coupon codes in uppercase
                Description = dto.Description,
                Type = (CouponType)dto.Type,
                Value = dto.Value,
                MinimumOrderAmount = dto.MinimumOrderAmount,
                MaximumDiscountAmount = dto.MaximumDiscountAmount,
                ValidFrom = dto.ValidFrom,
                ValidUntil = dto.ValidUntil,
                UsageLimit = dto.UsageLimit,
                IsCustomerOnly = dto.IsCustomerOnly,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UsageCount = 0
            };
        }
    }

    // Request DTOs
    public class ValidateCouponRequest
    {
        public string Code { get; set; } = string.Empty;
        public decimal OrderAmount { get; set; }
        public string? CartId { get; set; }
    }
}