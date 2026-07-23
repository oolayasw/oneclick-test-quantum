using QuoteFlow.Api.Infrastructure;
using QuoteFlow.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddSingleton<QuoteFlowStore>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ClientService>();
builder.Services.AddScoped<CatalogService>();
builder.Services.AddScoped<QuoteService>();
builder.Services.AddScoped<DashboardService>();

var app = builder.Build();

app.UseCors("Frontend");
app.UseAuthorization();
app.MapControllers();

app.Run();
