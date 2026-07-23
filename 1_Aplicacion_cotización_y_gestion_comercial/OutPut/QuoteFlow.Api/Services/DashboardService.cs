using QuoteFlow.Api.Domain;
using QuoteFlow.Api.Infrastructure;

namespace QuoteFlow.Api.Services;

public sealed class DashboardService(QuoteFlowStore store)
{
    public DashboardMetrics GetMetrics()
    {
        var totalQuotes = store.Quotes.Count;
        var totalQuotedValue = store.Quotes.Sum(item => item.Total);
        var acceptedQuotes = store.Quotes.Where(item => item.Status == "Aceptada").ToList();
        var acceptedValue = acceptedQuotes.Sum(item => item.Total);
        var pendingApprovals = store.Quotes.Count(item => item.Status == "Pendiente de aprobacion");
        var conversionRate = totalQuotes == 0 ? 0 : Math.Round((decimal)acceptedQuotes.Count / totalQuotes * 100m, 2);

        var recentActivity = store.Quotes
            .OrderByDescending(item => item.CreatedAt)
            .Take(5)
            .Select(item => new ActivityEntry(item.Number, item.Client, item.Status, item.CreatedAt))
            .ToList();

        return new DashboardMetrics(totalQuotes, totalQuotedValue, acceptedValue, conversionRate, pendingApprovals, recentActivity);
    }
}