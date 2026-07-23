using QuoteFlow.Api.Domain;
using QuoteFlow.Api.Infrastructure;

namespace QuoteFlow.Api.Services;

public sealed class AuthService(QuoteFlowStore store)
{
    public AuthResponse Login(AuthRequest request)
    {
        var user = store.Users.FirstOrDefault(item =>
            string.Equals(item.Email, request.Email, StringComparison.OrdinalIgnoreCase)
            && item.Password == request.Password);

        if (user is null)
        {
            throw new InvalidOperationException("Credenciales incorrectas");
        }

        var sessionUser = new SessionUser(user.Id, user.Name, user.Email, user.Role);
        var token = $"session-{user.Id}-{Guid.NewGuid():N}";
        store.Sessions[token] = sessionUser;

        return new AuthResponse(token, sessionUser);
    }

    public void Logout(string? token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return;
        }

        store.Sessions.Remove(token);
    }
}