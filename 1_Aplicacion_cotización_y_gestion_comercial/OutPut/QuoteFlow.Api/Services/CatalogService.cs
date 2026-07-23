using QuoteFlow.Api.Domain;
using QuoteFlow.Api.Infrastructure;

namespace QuoteFlow.Api.Services;

public sealed class CatalogService(QuoteFlowStore store)
{
    public IReadOnlyList<Product> GetProducts() => store.Products.OrderBy(item => item.Name).ToList();

    public Product CreateProduct(CreateProductRequest request)
    {
        ValidateProduct(request.Code, request.Name, request.Price);

        if (store.Products.Any(item => item.Code == request.Code))
        {
            throw new InvalidOperationException("Ya existe un producto con ese codigo");
        }

        var product = new Product(
            store.NextProductId(),
            request.Code,
            request.Name,
            request.Description,
            request.Price,
            request.Tax,
            request.Type,
            request.Status);

        store.Products.Add(product);
        return product;
    }

    public Product UpdateProduct(int id, UpdateProductRequest request)
    {
        ValidateProduct(request.Code, request.Name, request.Price);

        var current = store.Products.FirstOrDefault(item => item.Id == id)
            ?? throw new KeyNotFoundException("Producto no encontrado");

        if (store.Products.Any(item => item.Id != id && item.Code == request.Code))
        {
            throw new InvalidOperationException("Ya existe un producto con ese codigo");
        }

        var updated = current with
        {
            Code = request.Code,
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            Tax = request.Tax,
            Type = request.Type,
            Status = request.Status
        };

        var index = store.Products.FindIndex(item => item.Id == id);
        store.Products[index] = updated;
        return updated;
    }

    public IReadOnlyList<PriceList> GetPriceLists() => store.PriceLists.OrderBy(item => item.Name).ToList();

    public PriceList CreatePriceList(CreatePriceListRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new InvalidOperationException("El nombre de la lista es obligatorio");
        }

        var priceList = new PriceList(
            store.NextPriceListId(),
            request.Name,
            request.Segment,
            request.ValidFrom,
            request.ValidTo,
            request.MaxDiscount,
            request.Status);

        store.PriceLists.Add(priceList);
        return priceList;
    }

    private static void ValidateProduct(string code, string name, decimal price)
    {
        if (string.IsNullOrWhiteSpace(code) || string.IsNullOrWhiteSpace(name) || price <= 0)
        {
            throw new InvalidOperationException("Codigo, nombre y precio son obligatorios");
        }
    }
}