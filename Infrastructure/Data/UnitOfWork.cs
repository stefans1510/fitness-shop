using System.Collections.Concurrent;
using Core.Entities;
using Core.Interfaces;

namespace Infrastructure.Data
{
    public class UnitOfWork(ShopContext shopContext) : IUnitOfWork
    {
        private readonly ConcurrentDictionary<string, object> _repositories = new();
        public async Task<bool> Complete()
        {
            return await shopContext.SaveChangesAsync() > 0;
        }

        public void Dispose()
        {
            shopContext.Dispose();
        }

        public IGenericRepository<TEntity> Repository<TEntity>() where TEntity : BaseEntity
        {
            var type = typeof(TEntity).Name;

            return (IGenericRepository<TEntity>)_repositories.GetOrAdd(type, t =>
            {
                var repositoryType = typeof(GenericRepository<>).MakeGenericType(typeof(TEntity));
                return Activator.CreateInstance(repositoryType, shopContext)
                    ?? throw new InvalidOperationException(
                        $"Could not create repository instance for {t}"
                    );
            });
        }
    }
}