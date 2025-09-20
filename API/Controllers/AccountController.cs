using API.DTOs;
using API.Extensions;
using Core.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    public class AccountController(SignInManager<AppUser> signInManager) : BaseApiController
    {
        [HttpPost("register")]
        public async Task<ActionResult> Register(RegisterDto registerDto)
        {
            var user = new AppUser
            {
                FirstName = registerDto.FirstName,
                LastName = registerDto.IsCompanyRegistration ? string.Empty : registerDto.LastName,
                Email = registerDto.Email,
                UserName = registerDto.Email,
                CompanyCode = registerDto.IsCompanyRegistration ? registerDto.CompanyCode : null,
                IsCompanyUser = registerDto.IsCompanyRegistration
            };

            var result = await signInManager.UserManager.CreateAsync(user, registerDto.Password);

            if (!result.Succeeded)
            {
                foreach (var error in result.Errors)
                {
                    ModelState.AddModelError(error.Code, error.Description);
                }

                return ValidationProblem();
            }

            // Assign role based on registration type
            var roleName = registerDto.IsCompanyRegistration ? "Company" : "Customer";
            await signInManager.UserManager.AddToRoleAsync(user, roleName);

            return Ok();
        }

        [HttpGet("check-company-code/{companyCode}")]
        public async Task<ActionResult<bool>> CheckCompanyCodeAvailability(string companyCode)
        {
            var exists = await signInManager.UserManager.Users
                .AnyAsync(u => u.CompanyCode == companyCode);
            
            return Ok(new { available = !exists });
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<ActionResult> Logout()
        {
            await signInManager.SignOutAsync();

            return NoContent();
        }

        [HttpGet("user-info")]
        public async Task<ActionResult> GetUserInfo()
        {
            if (User.Identity?.IsAuthenticated == false) return NoContent();

            var user = await signInManager.UserManager.GetUserByEmailWithAddress(User);
            var roles = await signInManager.UserManager.GetRolesAsync(user);

            return Ok(new
            {
                user.FirstName,
                user.LastName,
                user.Email,
                user.CompanyCode,
                user.IsCompanyUser,
                address = user.Address?.ToDto(),
                roles = roles
            });
        }

        [HttpGet("auth-status")]
        public ActionResult GetAuthState()
        {
            return Ok(new { IsAuthenticated = User.Identity?.IsAuthenticated ?? false });
        }

        [Authorize]
        [HttpPost("address")]
        public async Task<ActionResult<Address>> CreateOrUpdateAddress(AddressDto addressDto)
        {
            var user = await signInManager.UserManager.GetUserByEmailWithAddress(User);

            if (user.Address == null)
            {
                user.Address = addressDto.ToEntity();
            }
            else
            {
                user.Address.UpdateFromDto(addressDto);
            }

            var result = await signInManager.UserManager.UpdateAsync(user);

            if (!result.Succeeded) return BadRequest("Error updating user address");

            return Ok(user.Address.ToDto());
        }
    }
}