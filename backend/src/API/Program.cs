using GymSaaS.Infrastructure;
using GymSaaS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("TenantStaff", policy => policy.RequireAssertion(_ => true));
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<GymSaaSDbContext>();
    dbContext.Database.Migrate();
}

app.UseAuthorization();
app.MapControllers();

app.Run();
