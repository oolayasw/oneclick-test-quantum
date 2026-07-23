using QuoteFlow.Api.Domain;
using QuoteFlow.Api.Infrastructure;

namespace QuoteFlow.Api.Services;

public sealed class QuoteService(QuoteFlowStore store)
{
    public IReadOnlyList<Quote> GetAll() => store.Quotes.OrderByDescending(item => item.CreatedAt).ToList();

    public Quote GetById(int id) => store.Quotes.FirstOrDefault(item => item.Id == id)
        ?? throw new KeyNotFoundException("Cotizacion no encontrada");

    public Quote Create(CreateQuoteRequest request, SessionUser advisor)
    {
        if (request.Items.Count == 0)
        {
            throw new InvalidOperationException("Debe agregar al menos un item");
        }

        var client = store.Clients.FirstOrDefault(item => item.Id == request.ClientId)
            ?? throw new KeyNotFoundException("Cliente no encontrado");

        var priceList = request.PriceListId.HasValue
            ? store.PriceLists.FirstOrDefault(item => item.Id == request.PriceListId.Value)
            : null;

        var items = request.Items.Select(MapItem).ToList();
        var subtotal = items.Sum(item => item.Subtotal);
        var discountAmount = subtotal * (request.Discount / 100m);
        var taxableBase = subtotal - discountAmount;
        var taxes = items.Sum(item => item.Subtotal * (item.Tax / 100m));
        var total = taxableBase + taxes;
        var initialStatus = request.SendForApproval ? "Pendiente de aprobacion" : "Borrador";
        var history = new List<QuoteStatusEntry>
        {
            new("Borrador", DateOnly.FromDateTime(DateTime.Today), advisor.Name, string.Empty)
        };

        if (request.SendForApproval)
        {
            history.Add(new QuoteStatusEntry("Pendiente de aprobacion", DateOnly.FromDateTime(DateTime.Today), advisor.Name, "Solicito aprobacion"));
        }

        var quote = new Quote(
            store.NextQuoteId(),
            BuildQuoteNumber(),
            client.Id,
            client.BusinessName,
            advisor.Id,
            advisor.Name,
            request.Currency,
            request.ValidUntil,
            request.PriceListId,
            priceList?.Name,
            request.Discount,
            subtotal,
            taxes,
            total,
            request.PaymentTerms,
            request.DeliveryTime,
            request.Notes,
            initialStatus,
            items,
            history,
            DateOnly.FromDateTime(DateTime.Today));

        store.Quotes.Add(quote);
        UpdateClientTotal(client.Id);

        return quote;
    }

    public Quote UpdateStatus(int id, UpdateQuoteStatusRequest request)
    {
        var current = GetById(id);
        var newHistory = current.StatusHistory
            .Append(new QuoteStatusEntry(request.Status, DateOnly.FromDateTime(DateTime.Today), request.UserName, request.Comment))
            .ToList();

        var updated = current with
        {
            Status = request.Status,
            StatusHistory = newHistory
        };

        var index = store.Quotes.FindIndex(item => item.Id == id);
        store.Quotes[index] = updated;
        UpdateClientTotal(updated.ClientId);
        return updated;
    }

    private QuoteItem MapItem(CreateQuoteItemRequest request)
    {
        var product = store.Products.FirstOrDefault(item => item.Id == request.ProductId)
            ?? throw new KeyNotFoundException("Producto no encontrado");

        if (request.Quantity <= 0)
        {
            throw new InvalidOperationException("La cantidad debe ser mayor a cero");
        }

        var gross = product.Price * request.Quantity;
        var discountAmount = gross * (request.Discount / 100m);
        var subtotal = gross - discountAmount;

        return new QuoteItem(product.Id, product.Code, product.Name, request.Quantity, product.Price, request.Discount, product.Tax, subtotal);
    }

    private string BuildQuoteNumber()
    {
        var nextId = store.QuoteCounter;
        var year = DateTime.Today.Year;
        return $"COT-{year}-{nextId:000}";
    }

    private void UpdateClientTotal(int clientId)
    {
        var current = store.Clients.First(item => item.Id == clientId);
        var totalQuoted = store.Quotes
            .Where(item => item.ClientId == clientId && item.Status is "Aprobada" or "Enviada" or "Aceptada" or "Pendiente de aprobacion")
            .Sum(item => item.Total);

        var updated = current with { TotalQuoted = totalQuoted };
        var index = store.Clients.FindIndex(item => item.Id == clientId);
        store.Clients[index] = updated;
    }
}