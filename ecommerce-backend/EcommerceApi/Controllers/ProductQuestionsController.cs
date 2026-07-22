using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using EcommerceApi.DTOs.Questions;
using EcommerceApi.Services;

namespace EcommerceApi.Controllers;

[ApiController, Route("api/v1/products/{productId}/questions")]
public class ProductQuestionsController : ControllerBase
{
    private readonly ProductQuestionService _questions;
    public ProductQuestionsController(ProductQuestionService questions) { _questions = questions; }

    [HttpGet]
    public async Task<IActionResult> GetQuestions(string productId)
        => Ok(await _questions.GetProductQuestions(productId));

    [Authorize, HttpPost]
    public async Task<IActionResult> CreateQuestion(string productId, [FromBody] CreateQuestionRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Question))
            return BadRequest(new { error = "Câu hỏi không được để trống" });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        try { return Ok(await _questions.CreateQuestion(userId, productId, request)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }

    [Authorize, HttpPost("{questionId}/answers")]
    public async Task<IActionResult> AnswerQuestion(string productId, string questionId, [FromBody] CreateAnswerRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Answer))
            return BadRequest(new { error = "Câu trả lời không được để trống" });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var isAdmin = User.IsInRole("Admin");
        try { return Ok(await _questions.AnswerQuestion(userId, questionId, request, isAdmin)); }
        catch (KeyNotFoundException ex) { return NotFound(new { error = ex.Message }); }
    }
}
