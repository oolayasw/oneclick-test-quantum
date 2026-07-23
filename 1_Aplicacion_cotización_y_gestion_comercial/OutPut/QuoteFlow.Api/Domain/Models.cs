namespace QuoteFlow.Api.Domain;

public sealed record User(int Id, string Name, string Email, string Password, string Role);

public sealed record SessionUser(int Id, string Name, string Email, string Role);

public sealed record AuthRequest(string Email, string Password);

public sealed record AuthResponse(string Token, SessionUser User);

public sealed record Client(
    int Id,
    string Identification,
    string BusinessName,
    string Contact,
    string Email,
    string Phone,
    string Address,
    string TaxCondition,
    string Status,
    decimal TotalQuoted);

public sealed record Product(
    int Id,
    string Code,
    string Name,
    string Description,
    decimal Price,
    decimal Tax,
    string Type,
    string Status);

public sealed record PriceList(
    int Id,
    string Name,
    string Segment,
    DateOnly ValidFrom,
    DateOnly ValidTo,
    decimal MaxDiscount,
    string Status);

public sealed record QuoteItem(
    int ProductId,
    string Code,
    string Name,
    int Quantity,
    decimal Price,
    decimal Discount,
    decimal Tax,
    decimal Subtotal);

public sealed record QuoteStatusEntry(string Status, DateOnly Date, string User, string Comment);

public sealed record Quote(
    int Id,
    string Number,
    int ClientId,
    string Client,
    int AdvisorId,
    string Advisor,
    string Currency,
    DateOnly ValidUntil,
    int? PriceListId,
    string? PriceListName,
    decimal Discount,
    decimal Subtotal,
    decimal Taxes,
    decimal Total,
    string PaymentTerms,
    string DeliveryTime,
    string Notes,
    string Status,
    IReadOnlyList<QuoteItem> Items,
    IReadOnlyList<QuoteStatusEntry> StatusHistory,
    DateOnly CreatedAt);

public sealed record DashboardMetrics(
    int TotalQuotes,
    decimal TotalQuotedValue,
    decimal AcceptedValue,
    decimal ConversionRate,
    int PendingApprovals,
    IReadOnlyList<ActivityEntry> RecentActivity);

public sealed record ActivityEntry(string Title, string Detail, string Status, DateOnly Date);

public sealed record CreateClientRequest(
    string Identification,
    string BusinessName,
    string Contact,
    string Email,
    string Phone,
    string Address,
    string TaxCondition,
    string Status);

public sealed record UpdateClientRequest(
    string Identification,
    string BusinessName,
    string Contact,
    string Email,
    string Phone,
    string Address,
    string TaxCondition,
    string Status);

public sealed record CreateProductRequest(
    string Code,
    string Name,
    string Description,
    decimal Price,
    decimal Tax,
    string Type,
    string Status);

public sealed record UpdateProductRequest(
    string Code,
    string Name,
    string Description,
    decimal Price,
    decimal Tax,
    string Type,
    string Status);

public sealed record CreatePriceListRequest(
    string Name,
    string Segment,
    DateOnly ValidFrom,
    DateOnly ValidTo,
    decimal MaxDiscount,
    string Status);

public sealed record CreateQuoteItemRequest(
    int ProductId,
    int Quantity,
    decimal Discount);

public sealed record CreateQuoteRequest(
    int ClientId,
    string Currency,
    DateOnly ValidUntil,
    int? PriceListId,
    decimal Discount,
    string PaymentTerms,
    string DeliveryTime,
    string Notes,
    bool SendForApproval,
    IReadOnlyList<CreateQuoteItemRequest> Items);

public sealed record UpdateQuoteStatusRequest(string Status, string Comment, string UserName);

public sealed record ClientDetail(Client Client, IReadOnlyList<Quote> QuoteHistory);