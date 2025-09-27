using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    public class FallbackController : Controller
    {
        public IActionResult Index()
        {
            // Only serve the SPA fallback for non-API routes
            if (Request.Path.StartsWithSegments("/api"))
            {
                return NotFound();
            }

            return PhysicalFile(
                Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "browser", "index.html"),
                "text/HTML"
            );
        }
    }
}