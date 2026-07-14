using GymSaaS.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("TenantStaff", policy => policy.RequireAssertion(_ => true));
});

var app = builder.Build();

app.UseAuthorization();
app.MapControllers();

app.Run();
