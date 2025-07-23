using System.Linq.Expressions;

namespace Core.Interfaces
{
  public interface ISpecification<T>
  {
    Expression<Func<T, bool>>? Criteria { get; }
    Expression<Func<T, object>>? OrderBy { get; }
    Expression<Func<T, object>>? OrderByDesc { get; }
    List<Expression<Func<T, object>>> Includes { get; }
    List<string> IncludeStrings { get; } //for ThenInclude method
    bool IsDistinct { get; }
    int Take { get; }              //pagination
    int Skip { get; }
    bool IsPagingEnabled { get; }
    IQueryable<T> ApplyCriteria(IQueryable<T> query);
  }

  public interface ISpecification<T, TResult> : ISpecification<T>
  {
    Expression<Func<T, TResult>>? Select { get; }
  }
}