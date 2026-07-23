using Microsoft.AspNetCore.Mvc;
using QuoteFlow.Api.Domain;
using QuoteFlow.Api.Services;

namespace QuoteFlow.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public sealed class DashboardController(DashboardService dashboardService) : ControllerBase
{
    [HttpGet]
    public ActionResult<DashboardMetrics> GetMetrics() => Ok(dashboardService.GetMetrics());
}