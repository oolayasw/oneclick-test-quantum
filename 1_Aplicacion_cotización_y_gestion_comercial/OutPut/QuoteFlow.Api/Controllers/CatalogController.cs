using Microsoft.AspNetCore.Mvc;
using QuoteFlow.Api.Domain;
using QuoteFlow.Api.Services;

namespace QuoteFlow.Api.Controllers;

[ApiController]
[Route("api")]
public sealed class CatalogController(CatalogService catalogService) : ControllerBase
{
    [HttpGet("productos")]
    public ActionResult<IReadOnlyList<Product>> GetProducts() => Ok(catalogService.GetProducts());

    [HttpPost("productos")]
    public ActionResult<Product> CreateProduct([FromBody] CreateProductRequest request)
    {
        try
        {
            return Ok(catalogService.CreateProduct(request));
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { error = exception.Message });
        }
    }

    [HttpPut("productos/{id:int}")]
    public ActionResult<Product> UpdateProduct(int id, [FromBody] UpdateProductRequest request)
    {
        try
        {
            return Ok(catalogService.UpdateProduct(id, request));
        }
        catch (Exception exception) when (exception is KeyNotFoundException or InvalidOperationException)
        {
            return exception is KeyNotFoundException
                ? NotFound(new { error = exception.Message })
                : BadRequest(new { error = exception.Message });
        }
    }

    [HttpGet("listas-precios")]
    public ActionResult<IReadOnlyList<PriceList>> GetPriceLists() => Ok(catalogService.GetPriceLists());

    [HttpPost("listas-precios")]
    public ActionResult<PriceList> CreatePriceList([FromBody] CreatePriceListRequest request)
    {
        try
        {
            return Ok(catalogService.CreatePriceList(request));
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { error = exception.Message });
        }
    }
}