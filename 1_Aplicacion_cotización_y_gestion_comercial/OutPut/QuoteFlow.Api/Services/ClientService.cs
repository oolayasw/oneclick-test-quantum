using QuoteFlow.Api.Domain;
using QuoteFlow.Api.Infrastructure;

namespace QuoteFlow.Api.Services;

public sealed class ClientService(QuoteFlowStore store)
{
    public IReadOnlyList<Client> GetAll() => store.Clients.OrderBy(item => item.BusinessName).ToList();

    public ClientDetail GetById(int id)
    {
        var client = store.Clients.FirstOrDefault(item => item.Id == id)
            ?? throw new KeyNotFoundException("Cliente no encontrado");

        var history = store.Quotes
            .Where(item => item.ClientId == id)
            .OrderByDescending(item => item.CreatedAt)
            .ToList();

        return new ClientDetail(client, history);
    }

    public Client Create(CreateClientRequest request)
    {
        Validate(request.Identification, request.BusinessName);

        if (store.Clients.Any(item => item.Identification == request.Identification))
        {
            throw new InvalidOperationException("Ya existe un cliente con esa identificacion");
        }

        var client = new Client(
            store.NextClientId(),
            request.Identification,
            request.BusinessName,
            request.Contact,
            request.Email,
            request.Phone,
            request.Address,
            request.TaxCondition,
            request.Status,
            0m);

        store.Clients.Add(client);
        return client;
    }

    public Client Update(int id, UpdateClientRequest request)
    {
        Validate(request.Identification, request.BusinessName);

        var current = store.Clients.FirstOrDefault(item => item.Id == id)
            ?? throw new KeyNotFoundException("Cliente no encontrado");

        if (store.Clients.Any(item => item.Id != id && item.Identification == request.Identification))
        {
            throw new InvalidOperationException("Ya existe un cliente con esa identificacion");
        }

        var updated = current with
        {
            Identification = request.Identification,
            BusinessName = request.BusinessName,
            Contact = request.Contact,
            Email = request.Email,
            Phone = request.Phone,
            Address = request.Address,
            TaxCondition = request.TaxCondition,
            Status = request.Status
        };

        ReplaceClient(updated);
        return updated;
    }

    public void Delete(int id)
    {
        var removed = store.Clients.RemoveAll(item => item.Id == id);
        if (removed == 0)
        {
            throw new KeyNotFoundException("Cliente no encontrado");
        }
    }

    private static void Validate(string identification, string businessName)
    {
        if (string.IsNullOrWhiteSpace(identification) || string.IsNullOrWhiteSpace(businessName))
        {
            throw new InvalidOperationException("Identificacion y razon social son obligatorias");
        }
    }

    private void ReplaceClient(Client client)
    {
        var index = store.Clients.FindIndex(item => item.Id == client.Id);
        store.Clients[index] = client;
    }
}