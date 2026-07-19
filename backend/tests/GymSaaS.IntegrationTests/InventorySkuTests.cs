using System.Net;
using Xunit;

namespace GymSaaS.IntegrationTests;

/// <summary>
/// Saving a product used to fall back to a lookup by SKU when no id was supplied, so registering a
/// product with a code that already existed silently overwrote that product's name, price, stock and
/// minimum — no error, HTTP 200, data gone. These pin the corrected behaviour.
/// </summary>
[Collection(ApiCollection.Name)]
public sealed class InventorySkuTests
{
    private readonly ApiFixture _fixture;

    public InventorySkuTests(ApiFixture fixture) => _fixture = fixture;

    [Fact]
    public async Task Registering_a_product_with_an_existing_sku_is_refused()
    {
        using var gym = await _fixture.RegisterGymAsync("Inventario");
        var sku = $"SKU{Guid.NewGuid():N}"[..12];

        var original = await gym.PostAsync("/api/products", new
        {
            sku,
            name = "Proteina Original",
            category = "Suplementos",
            price = 100_000m,
            stock = 10,
            minimumStock = 3
        });
        var originalId = original.GetGuid("id");

        using var response = await gym.TryPostAsync("/api/products", new
        {
            sku,
            name = "Producto totalmente distinto",
            category = "Bebidas",
            price = 5_000m,
            stock = 1,
            minimumStock = 1
        });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);

        // The original must be untouched — this is the data loss the fix is about.
        var products = await gym.GetAsync("/api/products");
        var stored = Assert.Single(products.EnumerateArray().Where(p => p.GetGuid("id") == originalId));
        Assert.Equal("Proteina Original", stored.GetProperty("name").GetString());
        Assert.Equal(100_000m, stored.GetProperty("price").GetDecimal());
        Assert.Equal(10, stored.GetProperty("stock").GetInt32());
        Assert.Equal(3, stored.GetProperty("minimumStock").GetInt32());
    }

    [Fact]
    public async Task Sku_conflicts_ignore_capitalisation()
    {
        using var gym = await _fixture.RegisterGymAsync("Inventario");
        var sku = $"ABC{Guid.NewGuid():N}"[..12].ToUpperInvariant();

        await gym.PostAsync("/api/products", new { sku, name = "Original", price = 1_000m, stock = 1, minimumStock = 1 });

        using var response = await gym.TryPostAsync("/api/products", new
        {
            sku = sku.ToLowerInvariant(),
            name = "Duplicado en minusculas",
            price = 2_000m,
            stock = 2,
            minimumStock = 1
        });

        // The inventory screen already treats SKUs case-insensitively; the API must agree.
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Single((await gym.GetAsync("/api/products")).EnumerateArray());
    }

    [Fact]
    public async Task Editing_a_product_by_id_still_works()
    {
        using var gym = await _fixture.RegisterGymAsync("Inventario");
        var sku = $"SKU{Guid.NewGuid():N}"[..12];

        var created = await gym.PostAsync("/api/products", new
        {
            sku, name = "Creatina", category = "Suplementos", price = 89_000m, stock = 5, minimumStock = 2
        });
        var id = created.GetGuid("id");

        // Same SKU, same product: must update in place, not trip the conflict check.
        var updated = await gym.PostAsync("/api/products", new
        {
            id, sku, name = "Creatina Monohidratada", category = "Suplementos", price = 95_000m, stock = 8, minimumStock = 4
        });

        Assert.Equal(id, updated.GetGuid("id"));
        Assert.Equal("Creatina Monohidratada", updated.GetProperty("name").GetString());
        Assert.Single((await gym.GetAsync("/api/products")).EnumerateArray());
    }

    [Fact]
    public async Task A_product_can_be_moved_to_a_free_sku_but_not_onto_a_taken_one()
    {
        using var gym = await _fixture.RegisterGymAsync("Inventario");
        var skuA = $"AAA{Guid.NewGuid():N}"[..12];
        var skuB = $"BBB{Guid.NewGuid():N}"[..12];
        var skuLibre = $"CCC{Guid.NewGuid():N}"[..12];

        var a = await gym.PostAsync("/api/products", new { sku = skuA, name = "Producto A", price = 1_000m, stock = 1, minimumStock = 1 });
        await gym.PostAsync("/api/products", new { sku = skuB, name = "Producto B", price = 2_000m, stock = 2, minimumStock = 1 });
        var idA = a.GetGuid("id");

        using var onto = await gym.TryPostAsync("/api/products", new
        {
            id = idA, sku = skuB, name = "Producto A", price = 1_000m, stock = 1, minimumStock = 1
        });
        Assert.Equal(HttpStatusCode.Conflict, onto.StatusCode);

        var moved = await gym.PostAsync("/api/products", new
        {
            id = idA, sku = skuLibre, name = "Producto A", price = 1_000m, stock = 1, minimumStock = 1
        });
        Assert.Equal(skuLibre, moved.GetProperty("sku").GetString());
        Assert.Equal(2, (await gym.GetAsync("/api/products")).EnumerateArray().Count());
    }

    [Fact]
    public async Task Two_gyms_can_use_the_same_sku()
    {
        using var alfa = await _fixture.RegisterGymAsync("Alfa");
        using var beta = await _fixture.RegisterGymAsync("Beta");
        var sku = "PROT-001";

        await alfa.PostAsync("/api/products", new { sku, name = "Proteina de Alfa", price = 100_000m, stock = 5, minimumStock = 1 });

        // The uniqueness is per gym: Beta's catalogue is its own, and must not collide with Alfa's.
        var betaProduct = await beta.PostAsync("/api/products", new
        {
            sku, name = "Proteina de Beta", price = 120_000m, stock = 3, minimumStock = 1
        });

        Assert.Equal("Proteina de Beta", betaProduct.GetProperty("name").GetString());
        Assert.Single((await alfa.GetAsync("/api/products")).EnumerateArray());
        Assert.Single((await beta.GetAsync("/api/products")).EnumerateArray());
    }
}
