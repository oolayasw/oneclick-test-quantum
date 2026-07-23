using QuoteFlow.Api.Domain;

namespace QuoteFlow.Api.Infrastructure;

public sealed class QuoteFlowStore
{
    private readonly object _syncRoot = new();

    public QuoteFlowStore()
    {
        Users = BuildUsers();
        Clients = BuildClients();
        Products = BuildProducts();
        PriceLists = BuildPriceLists();
        Quotes = BuildQuotes();
        QuoteCounter = Quotes.Max(item => item.Id) + 1;
        ClientCounter = Clients.Max(item => item.Id) + 1;
        ProductCounter = Products.Max(item => item.Id) + 1;
        PriceListCounter = PriceLists.Max(item => item.Id) + 1;
    }

    public List<User> Users { get; }

    public List<Client> Clients { get; }

    public List<Product> Products { get; }

    public List<PriceList> PriceLists { get; }

    public List<Quote> Quotes { get; }

    public Dictionary<string, SessionUser> Sessions { get; } = new(StringComparer.Ordinal);

    public int QuoteCounter { get; private set; }

    public int ClientCounter { get; private set; }

    public int ProductCounter { get; private set; }

    public int PriceListCounter { get; private set; }

    public T Execute<T>(Func<T> action)
    {
        lock (_syncRoot)
        {
            return action();
        }
    }

    public int NextQuoteId() => Execute(() => QuoteCounter++);

    public int NextClientId() => Execute(() => ClientCounter++);

    public int NextProductId() => Execute(() => ProductCounter++);

    public int NextPriceListId() => Execute(() => PriceListCounter++);

    private static List<User> BuildUsers() =>
    [
        new(1, "Asesor Demo", "asesor@quoteflow.com", "1234", "asesor"),
        new(2, "Supervisor Demo", "supervisor@quoteflow.com", "1234", "supervisor"),
        new(3, "Admin Demo", "admin@quoteflow.com", "1234", "admin")
    ];

    private static List<Client> BuildClients() =>
    [
        new(1, "900123456-1", "Empresa ABC S.A.S", "Juan Perez", "juan@empresaabc.com", "3001234567", "Calle 1 # 2-3, Bogota", "RESPONSABLE_IVA", "activo", 22610000m),
        new(2, "800987654-2", "Comercial XYZ Ltda", "Maria Garcia", "maria@xyz.com", "3009876543", "Carrera 5 # 10-20, Medellin", "NO_RESPONSABLE", "activo", 10067400m),
        new(3, "700555666-3", "Industrias 123 SAS", "Carlos Lopez", "carlos@ind123.com", "3005556666", "Av 6 # 15-30, Cali", "GRAN_CONTRIBUYENTE", "inactivo", 0m),
        new(4, "600111222-4", "Servicios Integrales SA", "Ana Martinez", "ana@servicios.com", "3101112222", "Diagonal 8 # 5-10, Barranquilla", "RESPONSABLE_IVA", "activo", 0m)
    ];

    private static List<Product> BuildProducts() =>
    [
        new(1, "PROD-001", "Software de gestion ERP", "Sistema completo de gestion empresarial", 5000000m, 19m, "Producto", "activo"),
        new(2, "PROD-002", "Licencia anual de uso", "Licencia de uso anual por usuario", 2000000m, 0m, "Producto", "activo"),
        new(3, "SERV-001", "Consultoria tecnica (hora)", "Hora de consultoria tecnica especializada", 150000m, 19m, "Servicio", "activo"),
        new(4, "SERV-002", "Soporte premium mensual", "Soporte tecnico 24/7 mensual", 800000m, 19m, "Servicio", "activo"),
        new(5, "PROD-003", "Servidor HPE ProLiant", "Servidor fisico HPE ProLiant DL380 Gen10", 12000000m, 19m, "Producto", "activo"),
        new(6, "SERV-003", "Capacitacion usuarios (dia)", "Jornada de capacitacion presencial", 500000m, 19m, "Servicio", "activo")
    ];

    private static List<PriceList> BuildPriceLists() =>
    [
        new(1, "Lista Estandar 2024", "General", new DateOnly(2024, 1, 1), new DateOnly(2024, 12, 31), 10m, "activa"),
        new(2, "Lista Corporativa Premium", "Corporativo", new DateOnly(2024, 1, 1), new DateOnly(2024, 12, 31), 25m, "activa"),
        new(3, "Lista PYME 2024", "PYME", new DateOnly(2024, 6, 1), new DateOnly(2024, 12, 31), 15m, "activa")
    ];

    private static List<Quote> BuildQuotes() =>
    [
        new(
            1,
            "COT-2024-001",
            1,
            "Empresa ABC S.A.S",
            1,
            "Asesor Demo",
            "COP",
            new DateOnly(2024, 12, 31),
            1,
            "Lista Estandar 2024",
            0m,
            7000000m,
            1330000m,
            8330000m,
            "30 dias",
            "15 dias habiles",
            "Cotizacion para modernizacion de sistemas internos",
            "Enviada",
            [
                new(1, "PROD-001", "Software de gestion ERP", 1, 5000000m, 0m, 19m, 5000000m),
                new(2, "PROD-002", "Licencia anual de uso", 1, 2000000m, 0m, 0m, 2000000m)
            ],
            [
                new("Borrador", new DateOnly(2024, 1, 10), "Asesor Demo", string.Empty),
                new("Pendiente de aprobacion", new DateOnly(2024, 1, 10), "Asesor Demo", "Solicito aprobacion"),
                new("Aprobada", new DateOnly(2024, 1, 11), "Supervisor Demo", "Aprobado. Margen adecuado."),
                new("Enviada", new DateOnly(2024, 1, 12), "Asesor Demo", "Enviada al cliente")
            ],
            new DateOnly(2024, 1, 10)),
        new(
            2,
            "COT-2024-002",
            2,
            "Comercial XYZ Ltda",
            1,
            "Asesor Demo",
            "COP",
            new DateOnly(2024, 11, 30),
            2,
            "Lista Corporativa Premium",
            10m,
            8460000m,
            1453140m,
            9913140m,
            "60 dias",
            "20 dias habiles",
            "Descuento del 10% por volumen solicitado por el cliente",
            "Pendiente de aprobacion",
            [
                new(3, "SERV-001", "Consultoria tecnica (hora)", 40, 150000m, 10m, 19m, 5400000m),
                new(4, "SERV-002", "Soporte premium mensual", 3, 800000m, 10m, 19m, 2160000m),
                new(2, "PROD-002", "Licencia anual de uso", 1, 2000000m, 0m, 0m, 2000000m)
            ],
            [
                new("Borrador", new DateOnly(2024, 1, 15), "Asesor Demo", string.Empty),
                new("Pendiente de aprobacion", new DateOnly(2024, 1, 16), "Asesor Demo", "Descuento 10% solicitado por volumen. Favor aprobar.")
            ],
            new DateOnly(2024, 1, 15)),
        new(
            3,
            "COT-2024-003",
            1,
            "Empresa ABC S.A.S",
            1,
            "Asesor Demo",
            "COP",
            new DateOnly(2024, 10, 31),
            1,
            "Lista Estandar 2024",
            0m,
            12000000m,
            2280000m,
            14280000m,
            "Contado",
            "30 dias habiles",
            "Reposicion de infraestructura de servidores",
            "Aceptada",
            [
                new(5, "PROD-003", "Servidor HPE ProLiant", 1, 12000000m, 0m, 19m, 12000000m)
            ],
            [
                new("Borrador", new DateOnly(2024, 1, 8), "Asesor Demo", string.Empty),
                new("Aprobada", new DateOnly(2024, 1, 9), "Supervisor Demo", "OK sin descuento"),
                new("Enviada", new DateOnly(2024, 1, 9), "Asesor Demo", string.Empty),
                new("Aceptada", new DateOnly(2024, 1, 20), "Asesor Demo", "Cliente confirmo compra")
            ],
            new DateOnly(2024, 1, 8)),
        new(
            4,
            "COT-2024-004",
            2,
            "Comercial XYZ Ltda",
            1,
            "Asesor Demo",
            "COP",
            new DateOnly(2024, 9, 30),
            2,
            "Lista Corporativa Premium",
            20m,
            3000000m,
            456000m,
            3456000m,
            "30 dias",
            "10 dias habiles",
            string.Empty,
            "Rechazada",
            [
                new(6, "SERV-003", "Capacitacion usuarios (dia)", 6, 500000m, 20m, 19m, 2400000m)
            ],
            [
                new("Borrador", new DateOnly(2023, 12, 1), "Asesor Demo", string.Empty),
                new("Pendiente de aprobacion", new DateOnly(2023, 12, 1), "Asesor Demo", "Descuento 20%"),
                new("Rechazada", new DateOnly(2023, 12, 2), "Supervisor Demo", "Descuento excesivo para este cliente. Resubmit con maximo 15%.")
            ],
            new DateOnly(2023, 12, 1))
    ];
}