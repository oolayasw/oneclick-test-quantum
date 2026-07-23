using Microsoft.AspNetCore.Mvc;
using QuoteFlow.Api.Domain;
using QuoteFlow.Api.Services;

namespace QuoteFlow.Api.Controllers;

[ApiController]
[Route("api/clientes")]
public sealed class ClientsController(ClientService clientService) : ControllerBase
{
    [HttpGet]
    public ActionResult<IReadOnlyList<Client>> GetAll() => Ok(clientService.GetAll());

    [HttpGet("{id:int}")]
    public ActionResult<ClientDetail> GetById(int id)
    {
        try
        {
            return Ok(clientService.GetById(id));
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { error = exception.Message });
        }
    }

    [HttpPost]
    public ActionResult<Client> Create([FromBody] CreateClientRequest request)
    {
        try
        {
            var client = clientService.Create(request);
            return CreatedAtAction(nameof(GetById), new { id = client.Id }, client);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { error = exception.Message });
        }
    }

    [HttpPut("{id:int}")]
    public ActionResult<Client> Update(int id, [FromBody] UpdateClientRequest request)
    {
        try
        {
            return Ok(clientService.Update(id, request));
        }
        catch (Exception exception) when (exception is KeyNotFoundException or InvalidOperationException)
        {
            return exception is KeyNotFoundException
                ? NotFound(new { error = exception.Message })
                : BadRequest(new { error = exception.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        try
        {
            clientService.Delete(id);
            return NoContent();
        }
        catch (KeyNotFoundException exception)
        {
            return NotFound(new { error = exception.Message });
        }
    }
}