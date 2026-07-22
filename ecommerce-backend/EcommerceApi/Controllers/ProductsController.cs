using Microsoft.AspNetCore.Mvc;
using EcommerceApi.DTOs.Products;
using EcommerceApi.Services;

namespace EcommerceApi.Controllers;

[ApiController, Route("api/v1/products")]
public class ProductsController : ControllerBase
{
    private readonly ProductService _products;
    public ProductsController(ProductService products) { _products = products; }

    [HttpGet]
    public async Task<IActionResult> GetProducts([FromQuery] ProductQueryParams query)
        => Ok(await _products.GetProducts(query));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProduct(string id)
    {
        var product = await _products.GetProduct(id);
        return product != null ? Ok(product) : NotFound(new { error = "Product not found" });
    }

    [HttpGet("featured")]
    public async Task<IActionResult> GetFeatured()
        => Ok(await _products.GetFeaturedProducts());

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q = "")
        => Ok(await _products.SearchProducts(q));
}

[ApiController, Route("api/v1/categories")]
public class CategoriesController : ControllerBase
{
    private readonly ProductService _products;
    public CategoriesController(ProductService products) { _products = products; }

    [HttpGet]
    public async Task<IActionResult> GetCategories()
        => Ok(await _products.GetCategories());

    [HttpGet("{slug}/products")]
    public async Task<IActionResult> GetProductsByCategory(string slug, [FromQuery] ProductQueryParams query)
        => Ok(await _products.GetProductsByCategory(slug, query));
}
