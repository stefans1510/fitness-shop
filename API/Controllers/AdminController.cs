using API.DTOs;
using API.Extensions;
using Core.Entities;
using Core.Entities.OrderAggregate;
using Core.Interfaces;
using Core.Specifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    [Authorize(Roles = "Admin")]
    public class AdminController(
        IUnitOfWork unitOfWork,
        IPaymentService paymentService,
        UserManager<AppUser> userManager
    ) : BaseApiController
    {
        // Order Management Methods
        [HttpGet("orders")]
        public async Task<ActionResult<IReadOnlyList<OrderDto>>> GetOrders(
            [FromQuery] OrderSpecificationParameters orerSpecParams
        )
        {
            var specification = new OrderSpecification(orerSpecParams);

            return await CreatePagedResult(
                unitOfWork.Repository<Order>(),
                specification,
                orerSpecParams.PageIndex,
                orerSpecParams.PageSize,
                o => o.ToDto()
            );
        }

        [HttpGet("orders/{id:int}")]
        public async Task<ActionResult<OrderDto>> GetOrder(int id)
        {
            var specification = new OrderSpecification(id);

            var order = await unitOfWork.Repository<Order>().GetEntityWithSpecification(specification);

            if (order == null) return BadRequest("No order found");

            return order.ToDto();
        }

        [HttpPost("orders/refund/{id:int}")]
        public async Task<ActionResult<OrderDto>> RefundOrder(int id)
        {
            var specification = new OrderSpecification(id);
            var order = await unitOfWork.Repository<Order>().GetEntityWithSpecification(specification);

            if (order == null) return BadRequest("No order found");

            if (order.Status == OrderStatus.Pending)
                return BadRequest("Payment not received for this order");

            var result = await paymentService.RefundPayment(order.PaymentIntentId);

            if (result == "succeeded")
            {
                order.Status = OrderStatus.Refunded;

                await unitOfWork.Complete();

                return order.ToDto();
            }

            return BadRequest("Problem refunding order");
        }

        // Product Management Methods
        [HttpPost("products")]
        public async Task<ActionResult<Product>> CreateProduct(Product product)
        {
            unitOfWork.Repository<Product>().Add(product);

            if (await unitOfWork.Complete())
            {
                return CreatedAtAction("GetProduct", "Products", new { id = product.Id }, product);
            }

            return BadRequest("Problem creating product");
        }

        [HttpPost("products/upload-picture")]
        public async Task<ActionResult> UploadProductPicture([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            // Sanitize filename - replace spaces and special characters
            var originalFileName = file.FileName;
            var fileExtension = Path.GetExtension(originalFileName);
            var fileNameWithoutExtension = Path.GetFileNameWithoutExtension(originalFileName);
            
            // Replace spaces with hyphens and remove other problematic characters
            var sanitizedFileName = fileNameWithoutExtension
                .Replace(" ", "-")
                .Replace("(", "")
                .Replace(")", "")
                .Replace("[", "")
                .Replace("]", "")
                .Replace("{", "")
                .Replace("}", "")
                .Replace("&", "and")
                .Replace("#", "")
                .Replace("%", "")
                .Replace("@", "")
                .Replace("!", "")
                .Replace("$", "")
                .Replace("^", "")
                .Replace("*", "")
                .Replace("=", "")
                .Replace("+", "")
                .Replace("?", "")
                .Replace("<", "")
                .Replace(">", "")
                .Replace("|", "")
                .Replace("\\", "")
                .Replace("/", "")
                .Replace(":", "")
                .Replace(";", "")
                .Replace("\"", "")
                .Replace("'", "")
                .Replace(",", "")
                .ToLower();

            var sanitizedFullFileName = sanitizedFileName + fileExtension.ToLower();

            // Use the client's src/assets/images/products folder (Angular watches this folder)
            var clientAssetsPath = Path.Combine(Directory.GetCurrentDirectory(), "..", "client", "src", "assets", "images", "products");
            var uploadsFolder = Path.GetFullPath(clientAssetsPath);

            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // Check if file already exists
            var filePath = Path.Combine(uploadsFolder, sanitizedFullFileName);
            if (System.IO.File.Exists(filePath))
            {
                return BadRequest(new { 
                    message = $"A file with the name '{sanitizedFullFileName}' already exists. Please rename your file or choose a different image.",
                    fileName = sanitizedFullFileName 
                });
            }

            // Save the file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var relativePath = "/assets/images/products/" + sanitizedFullFileName;

            return Ok(new { pictureUrl = relativePath });
        }

        [HttpPut("products/{id:int}")]
        public async Task<ActionResult> UpdateProduct(int id, Product product)
        {
            if (product.Id != id || !ProductExists(id))
                return BadRequest("Cannot update this produt");

            unitOfWork.Repository<Product>().Update(product);

            if (await unitOfWork.Complete())
            {
                return NoContent();
            }

            return BadRequest("Problem updating product");
        }

        private bool ProductExists(int id)
        {
            return unitOfWork.Repository<Product>().Exists(id);
        }

        [HttpDelete("products/{id:int}")]
        public async Task<ActionResult> DeleteProduct(int id)
        {
            var product = await unitOfWork.Repository<Product>().GetByIdAsync(id);

            if (product == null) return NotFound();

            unitOfWork.Repository<Product>().Remove(product);

            if (await unitOfWork.Complete())
            {
                return NoContent();
            }

            return BadRequest("Problem deleting product");
        }

        [HttpDelete("products/brands/{brandName}")]
        public async Task<ActionResult> DeleteBrand(string brandName)
        {
            try
            {
                // Get all products directly without pagination to check for brand usage
                var allProducts = await unitOfWork.Repository<Product>().ListAllAsync();
                var productsWithBrand = allProducts.Where(p => string.Equals(p.Brand, brandName, StringComparison.OrdinalIgnoreCase)).ToList();

                if (productsWithBrand.Any())
                {
                    return BadRequest(new
                    {
                        message = $"Cannot delete brand '{brandName}' as it is being used by {productsWithBrand.Count} product(s)",
                        products = productsWithBrand.Select(p => new { p.Id, p.Name }).ToArray()
                    });
                }

                // If no products use this brand, it's effectively "deleted" (won't appear in brand list)
                return Ok(new { message = $"Brand '{brandName}' is not used by any products and has been removed from the list." });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error checking brand usage: {ex.Message}");
            }
        }
        
        [HttpDelete("products/types/{typeName}")]
        public async Task<ActionResult> DeleteType(string typeName)
        {
            try
            {
                // Get all products directly without pagination to check for type usage
                var allProducts = await unitOfWork.Repository<Product>().ListAllAsync();
                var productsWithType = allProducts.Where(p => string.Equals(p.Type, typeName, StringComparison.OrdinalIgnoreCase)).ToList();

                if (productsWithType.Any())
                {
                    return BadRequest(new { 
                        message = $"Cannot delete type '{typeName}' as it is being used by {productsWithType.Count} product(s)",
                        products = productsWithType.Select(p => new { p.Id, p.Name }).ToArray()
                    });
                }

                // If no products use this type, it's effectively "deleted" (won't appear in type list)
                return Ok(new { message = $"Type '{typeName}' is not used by any products and has been removed from the list." });
            }
            catch (Exception ex)
            {
                return BadRequest($"Error checking type usage: {ex.Message}");
            }
        }

        // User Management Methods
        [HttpGet("users")]
        public async Task<ActionResult> GetUsers(
            [FromQuery] UserSpecificationParameters userSpecParams
        )
        {
            // Get users from Identity (since AppUser doesn't inherit from BaseEntity)
            var users = userManager.Users.AsQueryable();

            // Apply search filter
            if (!string.IsNullOrEmpty(userSpecParams.Search))
            {
                users = users.Where(u => 
                    (u.Email != null && u.Email.ToLower().Contains(userSpecParams.Search.ToLower())) ||
                    (u.FirstName != null && u.FirstName.ToLower().Contains(userSpecParams.Search.ToLower())) ||
                    (u.LastName != null && u.LastName.ToLower().Contains(userSpecParams.Search.ToLower()))
                );
            }

            // Get all users that match search criteria first
            var allUsers = await users.ToListAsync();
            
            // Create DTOs with role information and apply role filtering
            var userDtos = new List<UserDto>();
            foreach (var user in allUsers)
            {
                var roles = await userManager.GetRolesAsync(user);
                var userDto = user.ToDto(roles);
                
                // Apply role filter if specified
                if (!string.IsNullOrEmpty(userSpecParams.Role) && userSpecParams.Role != "All")
                {
                    if (roles.Contains(userSpecParams.Role))
                    {
                        userDtos.Add(userDto);
                    }
                }
                else
                {
                    userDtos.Add(userDto);
                }
            }

            // Apply pagination to filtered results
            var totalItems = userDtos.Count;
            var paginatedUsers = userDtos
                .Skip(userSpecParams.PageSize * (userSpecParams.PageIndex - 1))
                .Take(userSpecParams.PageSize)
                .ToList();

            var pagination = new API.RequestHelpers.Pagination<UserDto>(
                userSpecParams.PageIndex, 
                userSpecParams.PageSize, 
                totalItems, 
                paginatedUsers
            );

            return Ok(pagination);
        }

        [HttpDelete("users/{userId}")]
        public async Task<ActionResult> DeleteUser(string userId)
        {
            var user = await userManager.FindByIdAsync(userId);
            
            if (user == null)
                return NotFound("User not found");

            // Hard delete - safe because orders only store email as string
            var result = await userManager.DeleteAsync(user);
            
            if (result.Succeeded)
            {
                return Ok(new { message = $"User {user.Email} has been permanently deleted. Order history remains intact." });
            }
            
            return BadRequest("Problem deleting user");
        }

        [HttpPost("users/create-admin")]
        public async Task<ActionResult> CreateAdminUser([FromBody] RegisterDto registerDto)
        {
            // Check if user with this email already exists
            var existingUser = await userManager.FindByEmailAsync(registerDto.Email);
            if (existingUser != null)
            {
                return BadRequest(new { message = "A user with this email already exists." });
            }

            var user = new AppUser
            {
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                Email = registerDto.Email,
                UserName = registerDto.Email,
                IsCompanyUser = false // Admin users are not company users
            };

            var result = await userManager.CreateAsync(user, registerDto.Password);

            if (!result.Succeeded)
            {
                var errors = result.Errors.Select(e => e.Description).ToArray();
                return BadRequest(new { message = "Failed to create user", errors });
            }

            // Assign Admin role
            await userManager.AddToRoleAsync(user, "Admin");

            return Ok(new { message = $"Admin user '{user.Email}' created successfully" });
        }

        // Delivery Methods Management
        [HttpGet("delivery-methods")]
        public async Task<ActionResult<IReadOnlyList<DeliveryMethod>>> GetDeliveryMethods()
        {
            return Ok(await unitOfWork.Repository<DeliveryMethod>().ListAllAsync());
        }

        [HttpPost("delivery-methods")]
        public async Task<ActionResult<DeliveryMethod>> CreateDeliveryMethod(DeliveryMethod deliveryMethod)
        {
            unitOfWork.Repository<DeliveryMethod>().Add(deliveryMethod);

            if (await unitOfWork.Complete())
            {
                return CreatedAtAction("GetDeliveryMethods", new { id = deliveryMethod.Id }, deliveryMethod);
            }

            return BadRequest("Problem creating delivery method");
        }

        [HttpPut("delivery-methods/{id:int}")]
        public async Task<ActionResult> UpdateDeliveryMethod(int id, DeliveryMethod deliveryMethod)
        {
            if (deliveryMethod.Id != id || !DeliveryMethodExists(id))
                return BadRequest("Cannot update this delivery method");

            unitOfWork.Repository<DeliveryMethod>().Update(deliveryMethod);

            if (await unitOfWork.Complete())
            {
                return NoContent();
            }

            return BadRequest("Problem updating delivery method");
        }

        [HttpDelete("delivery-methods/{id:int}")]
        public async Task<ActionResult> DeleteDeliveryMethod(int id)
        {
            var deliveryMethod = await unitOfWork.Repository<DeliveryMethod>().GetByIdAsync(id);

            if (deliveryMethod == null) return NotFound();

            // Check if any orders are using this delivery method
            var allOrders = await unitOfWork.Repository<Order>().ListAllAsync();
            
            if (allOrders.Any(o => o.DeliveryMethod?.Id == id))
            {
                return BadRequest(new { 
                    message = "Cannot delete delivery method as it is being used by existing orders" 
                });
            }

            unitOfWork.Repository<DeliveryMethod>().Remove(deliveryMethod);

            if (await unitOfWork.Complete())
            {
                return NoContent();
            }

            return BadRequest("Problem deleting delivery method");
        }

        private bool DeliveryMethodExists(int id)
        {
            return unitOfWork.Repository<DeliveryMethod>().Exists(id);
        }
    }
}