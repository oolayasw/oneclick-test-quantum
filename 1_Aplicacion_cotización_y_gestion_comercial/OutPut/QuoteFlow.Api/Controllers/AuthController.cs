using Microsoft.AspNetCore.Mvc;
using QuoteFlow.Api.Domain;
using QuoteFlow.Api.Services;

namespace QuoteFlow.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(AuthService authService) : ControllerBase
{
    [HttpPost("login")]
    public ActionResult<AuthResponse> Login([FromBody] AuthRequest request)
    {
        try
        {
            return Ok(authService.Login(request));
        }
        catch (InvalidOperationException exception)
        {
            return Unauthorized(new { error = exception.Message });
        }
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        authService.Logout(Request.Headers.Authorization.ToString());
        return Ok(new { message = "Sesion cerrada" });
    }
}