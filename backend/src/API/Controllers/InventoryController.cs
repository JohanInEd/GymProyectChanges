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

        Product? product = null;
        if (request.Id is Guid id && id != Guid.Empty)
        {
            product = await _dbContext.Products.SingleOrDefaultAsync(p => p.Id == id, cancellationToken);
        }

        product ??= await _dbContext.Products.SingleOrDefaultAsync(p => p.Sku == sku, cancellationToken);

        if (product is null)
        {
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
        else if (product.Sku != sku)
        {
            var skuTaken = await _dbContext.Products.AnyAsync(p => p.Sku == sku && p.Id != product.Id, cancellationToken);
            if (skuTaken)
            {
                return Conflict("Ya existe un producto con este SKU.");
            }

            product.Sku = sku;
        }

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
