using Microsoft.AspNetCore.Mvc;
using QuoteFlow.Api.Domain;
using QuoteFlow.Api.Infrastructure;
using QuoteFlow.Api.Services;

namespace QuoteFlow.Api.Controllers;

[ApiController]
[Route("api/cotizaciones")]
public sealed class QuotesController(QuoteService quoteService, QuoteFlowStore store) : ControllerBase
{
    [HttpGet]
    public ActionResult<IReadOnlyList<Quote>> GetAll() => Ok(quoteService.GetAll());

    [HttpGet("{id:int}")]
    public ActionResult<Quote> GetById(int id)
    {
        try
        {
            return Ok(quoteService.GetById(id));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { error = exception.Message });
        }
    }

    [HttpPost]
    public ActionResult<Quote> Create([FromBody] CreateQuoteRequest request)
    {
        try
        {
            var session = ResolveSessionUser();
            var quote = quoteService.Create(request, session);
            return Ok(quote);
        }
        catch (Exception exception) when (exception is KeyNotFoundException or InvalidOperationException)
        {
            return exception is KeyNotFoundException
                ? NotFound(new { error = exception.Message })
                : BadRequest(new { error = exception.Message });
        }
    }

    [HttpPut("{id:int}/estado")]
    public ActionResult<Quote> UpdateStatus(int id, [FromBody] UpdateQuoteStatusRequest request)
    {
        try
        {
            return Ok(quoteService.UpdateStatus(id, request));
        }
        catch (Exception exception) when (exception is KeyNotFoundException or InvalidOperationException)
        {
            return exception is KeyNotFoundException
                ? NotFound(new { error = exception.Message })
                : BadRequest(new { error = exception.Message });
        }
    }

    private SessionUser ResolveSessionUser()
    {
        var token = Request.Headers.Authorization.ToString();
        if (!string.IsNullOrWhiteSpace(token) && store.Sessions.TryGetValue(token, out var user))
        {
            return user;
        }

        return new SessionUser(1, "Asesor Demo", "asesor@quoteflow.com", "asesor");
    }
}