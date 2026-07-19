using GymSaaS.Application.Abstractions;
using GymSaaS.Application.DTOs.Inventory;
using GymSaaS.Domain.Entities;
using GymSaaS.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GymSaaS.API.Controllers;

[ApiController]
[Route("api/products")]
[Authorize(Policy = "TenantStaff")]
public sealed class InventoryController : ControllerBase
{
    private readonly GymSaaSDbContext _dbContext;
    private readonly ITenantProvider _tenantProvider;

    public InventoryController(GymSaaSDbContext dbContext, ITenantProvider tenantProvider)
    {
        _dbContext = dbContext;
        _tenantProvider = tenantProvider;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductDto>>> GetAll(CancellationToken cancellationToken)
    {
        var products = await _dbContext.Products
            .AsNoTracking()
            .OrderBy(p => p.Name)
            .Select(p => new ProductDto(p.Id, p.Sku, p.Name, p.Category, p.Price, p.Stock, p.MinimumStock))
            .ToListAsync(cancellationToken);

        return Ok(products);
    }

    [HttpPost]
    public async Task<ActionResult<ProductDto>> Save(SaveProductRequest request, CancellationToken cancellationToken)
    {
        var sku = (request.Sku ?? string.Empty).Trim();
        var name = (request.Name ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(sku) || string.IsNullOrWhiteSpace(name))
        {
            return BadRequest("El SKU y el nombre del producto son obligatorios.");
        }

        // Compared case-insensitively so "ABC-1" and "abc-1" are the same product to the API, the
        // way the inventory screen already treats them.
        var owner = await _dbContext.Products
            .SingleOrDefaultAsync(p => p.Sku.ToUpper() == sku.ToUpper(), cancellationToken);

        Product? product = null;
        if (request.Id is Guid id && id != Guid.Empty)
        {
            product = await _dbContext.Products.SingleOrDefaultAsync(p => p.Id == id, cancellationToken);
        }

        if (product is null)
        {
            // Creating. An existing SKU is a conflict, not an instruction to overwrite: this used to
            // fall through to the row that already had the SKU and replace its name, price, stock
            // and minimum in place, so a mistyped code silently destroyed a different product.
            if (owner is not null)
            {
                return Conflict("Ya existe un producto con este SKU.");
            }

            product = new Product
            {
                Id = Guid.NewGuid(),
                TenantId = _tenantProvider.CurrentTenantId,
                Sku = sku,
                Name = name,
                Currency = "COP"
            };
            _dbContext.Products.Add(product);
        }
        else if (owner is not null && owner.Id != product.Id)
        {
            // Editing, and moving this product onto a SKU another product already holds.
            return Conflict("Ya existe un producto con este SKU.");
        }

        product.Sku = sku;
        product.Name = name;
        product.Category = string.IsNullOrWhiteSpace(request.Category) ? null : request.Category.Trim();
        product.Price = request.Price;
        product.Stock = request.Stock;
        product.MinimumStock = request.MinimumStock;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new ProductDto(product.Id, product.Sku, product.Name, product.Category, product.Price, product.Stock, product.MinimumStock));
    }

    [HttpPut("{id:guid}/stock")]
    public async Task<ActionResult<ProductDto>> UpdateStock(Guid id, UpdateStockRequest request, CancellationToken cancellationToken)
    {
        var product = await _dbContext.Products.SingleOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (product is null)
        {
            return NotFound();
        }

        product.Stock = Math.Max(0, request.Stock);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new ProductDto(product.Id, product.Sku, product.Name, product.Category, product.Price, product.Stock, product.MinimumStock));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var product = await _dbContext.Products.SingleOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (product is null)
        {
            return NotFound();
        }

        _dbContext.Products.Remove(product);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
