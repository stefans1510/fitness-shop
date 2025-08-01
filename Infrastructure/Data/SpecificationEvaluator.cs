using Core.Entities;
using Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Data
{
    public class SpecificationEvaluator<T> where T : BaseEntity
    {
        public static IQueryable<T> GetQuery(
            IQueryable<T> query, ISpecification<T> specification
        )
        {
            if (specification.Criteria != null)
            {
                query = query.Where(specification.Criteria); // x => x.Brand == brand
            }

            if (specification.OrderBy != null)
            {
                query = query.OrderBy(specification.OrderBy);
            }

            if (specification.OrderByDesc != null)
            {
                query = query.OrderByDescending(specification.OrderByDesc);
            }

            if (specification.IsDistinct)
            {
                query = query.Distinct();
            }

            if (specification.IsPagingEnabled)
            {
                query = query.Skip(specification.Skip).Take(specification.Take);
            }

            query = specification.Includes.Aggregate(
                query, (current, include) => current.Include(include)
            );
            query = specification.IncludeStrings.Aggregate(
                query, (current, include) => current.Include(include)
            );

            return query;
        }

        public static IQueryable<TResult> GetQuery<TSpec, TResult>(
            IQueryable<T> query, ISpecification<T, TResult> specification
        )
        {
            if (specification.Criteria != null)
            {
                query = query.Where(specification.Criteria); // x => x.Brand == brand
            }

            if (specification.OrderBy != null)
            {
                query = query.OrderBy(specification.OrderBy);
            }

            if (specification.OrderByDesc != null)
            {
                query = query.OrderByDescending(specification.OrderByDesc);
            }

            var selectQuery = query as IQueryable<TResult>;

            if (specification.Select != null)
            {
                selectQuery = query.Select(specification.Select);
            }

            if (specification.IsDistinct)
            {
                selectQuery = selectQuery?.Distinct();
            }

            if (specification.IsPagingEnabled)
            {
                selectQuery = selectQuery?.Skip(specification.Skip).Take(specification.Take);
            }

            return selectQuery ?? query.Cast<TResult>();
        }
    }
}