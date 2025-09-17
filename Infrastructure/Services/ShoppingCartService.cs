using System.Text.Json;
using Core.Entities;
using Core.Interfaces;
using StackExchange.Redis;

namespace Infrastructure.Services
{
    public class ShoppingCartService(IConnectionMultiplexer redis) : IShoppingCartService
    {
        private readonly IDatabase _database = redis.GetDatabase();
        public async Task<bool> DeleteShoppingCartAsync(string key)
        {
            return await _database.KeyDeleteAsync(key);
        }

        public async Task<ShoppingCart?> GetShoppingCartAsync(string key)
        {
            var data = await _database.StringGetAsync(key);

            return data.IsNullOrEmpty ? null : JsonSerializer.Deserialize<ShoppingCart>(data!);
        }

        public async Task<ShoppingCart?> SetShoppingCartAsync(ShoppingCart cart)
        {
            var created = await _database.StringSetAsync(cart.Id,
                JsonSerializer.Serialize(cart), TimeSpan.FromDays(30));

            if (!created) return null;

            return await GetShoppingCartAsync(cart.Id);
        }
    }
}