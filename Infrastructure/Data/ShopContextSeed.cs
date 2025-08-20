using System.Reflection;
using System.Text.Json;
using Core.Entities;
using Microsoft.AspNetCore.Identity;

namespace Infrastructure.Data
{
    public class ShopContextSeed
    {
        public static async Task SeedAsync(ShopContext context, UserManager<AppUser> userManager)
        {
            var adminEmail = Environment.GetEnvironmentVariable("ADMIN_EMAIL");
            var adminPassword = Environment.GetEnvironmentVariable("ADMIN_PASSWORD");
            
            if (
                !string.IsNullOrEmpty(adminEmail) &&
                !string.IsNullOrEmpty(adminPassword) &&
                !userManager.Users.Any(x => x.UserName == adminEmail)
            )
            {
                var user = new AppUser
                {
                    UserName = adminEmail,
                    Email = adminEmail
                };

                await userManager.CreateAsync(user, adminPassword);
                await userManager.AddToRoleAsync(user, "Admin");
            }
            
            var path = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);

            if (!context.Products.Any())
            {
                var productsData = await File
                    .ReadAllTextAsync(path + @"/Data/SeedData/products.json");

                var products = JsonSerializer.Deserialize<List<Product>>(productsData);

                if (products == null) return;

                context.Products.AddRange(products);

                await context.SaveChangesAsync();
            }

            if (!context.DeliveryMethods.Any())
            {
                var deliveryMethodsData = await File.ReadAllTextAsync(path + @"/Data/SeedData/delivery.json");

                var deliveryMethods = JsonSerializer.Deserialize<List<DeliveryMethod>>(deliveryMethodsData);

                if (deliveryMethods == null) return;

                context.DeliveryMethods.AddRange(deliveryMethods);

                await context.SaveChangesAsync();
            }
        }
    }
}