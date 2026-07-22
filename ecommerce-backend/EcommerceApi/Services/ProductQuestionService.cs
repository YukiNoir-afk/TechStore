using MongoDB.Driver;
using EcommerceApi.Data;
using EcommerceApi.DTOs.Questions;
using EcommerceApi.Models;

namespace EcommerceApi.Services;

public class ProductQuestionService
{
    private readonly MongoDbContext _db;

    public ProductQuestionService(MongoDbContext db)
    {
        _db = db;
    }

    public async Task<List<QuestionDto>> GetProductQuestions(string productId)
    {
        var questions = await _db.ProductQuestions
            .Find(q => q.ProductId == productId)
            .SortByDescending(q => q.CreatedAt)
            .ToListAsync();

        if (!questions.Any()) return new List<QuestionDto>();

        // Collect all user IDs (from questions and answers)
        var userIds = questions.Select(q => q.UserId)
            .Concat(questions.SelectMany(q => q.Answers.Select(a => a.UserId)))
            .Distinct()
            .ToList();

        var users = await _db.Users.Find(u => userIds.Contains(u.Id)).ToListAsync();
        var userMap = users.ToDictionary(u => u.Id);

        return questions.Select(q =>
        {
            var qUser = userMap.GetValueOrDefault(q.UserId);
            return new QuestionDto
            {
                Id = q.Id,
                Question = q.Question,
                UserName = qUser != null ? $"{qUser.FirstName} {qUser.LastName[0]}." : "Ẩn danh",
                AnswerCount = q.Answers.Count,
                Answers = q.Answers.Select(a =>
                {
                    var aUser = userMap.GetValueOrDefault(a.UserId);
                    return new AnswerDto
                    {
                        Id = a.Id,
                        Answer = a.Answer,
                        UserName = a.IsAdmin
                            ? "🛡️ TechStore"
                            : (aUser != null ? $"{aUser.FirstName} {aUser.LastName[0]}." : "Ẩn danh"),
                        IsAdmin = a.IsAdmin,
                        CreatedAt = a.CreatedAt
                    };
                }).OrderBy(a => a.CreatedAt).ToList(),
                CreatedAt = q.CreatedAt
            };
        }).ToList();
    }

    public async Task<QuestionDto> CreateQuestion(string userId, string productId, CreateQuestionRequest request)
    {
        var product = await _db.Products.Find(p => p.Id == productId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Không tìm thấy sản phẩm");

        var user = await _db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Không tìm thấy người dùng");

        var question = new ProductQuestion
        {
            ProductId = productId,
            UserId = userId,
            Question = request.Question
        };

        await _db.ProductQuestions.InsertOneAsync(question);

        return new QuestionDto
        {
            Id = question.Id,
            Question = question.Question,
            UserName = $"{user.FirstName} {user.LastName[0]}.",
            AnswerCount = 0,
            Answers = new List<AnswerDto>(),
            CreatedAt = question.CreatedAt
        };
    }

    public async Task<QuestionDto> AnswerQuestion(string userId, string questionId, CreateAnswerRequest request, bool isAdmin)
    {
        var user = await _db.Users.Find(u => u.Id == userId).FirstOrDefaultAsync()
            ?? throw new KeyNotFoundException("Không tìm thấy người dùng");

        var answer = new QuestionAnswer
        {
            UserId = userId,
            Answer = request.Answer,
            IsAdmin = isAdmin
        };

        var update = Builders<ProductQuestion>.Update.Push(q => q.Answers, answer);

        var result = await _db.ProductQuestions.FindOneAndUpdateAsync(
            q => q.Id == questionId, update,
            new FindOneAndUpdateOptions<ProductQuestion> { ReturnDocument = ReturnDocument.After }
        );

        if (result == null) throw new KeyNotFoundException("Không tìm thấy câu hỏi");

        // Rebuild DTO
        var allUserIds = new[] { result.UserId }
            .Concat(result.Answers.Select(a => a.UserId))
            .Distinct().ToList();

        var users = await _db.Users.Find(u => allUserIds.Contains(u.Id)).ToListAsync();
        var userMap = users.ToDictionary(u => u.Id);

        var qUser = userMap.GetValueOrDefault(result.UserId);
        return new QuestionDto
        {
            Id = result.Id,
            Question = result.Question,
            UserName = qUser != null ? $"{qUser.FirstName} {qUser.LastName[0]}." : "Ẩn danh",
            AnswerCount = result.Answers.Count,
            Answers = result.Answers.Select(a =>
            {
                var aUser = userMap.GetValueOrDefault(a.UserId);
                return new AnswerDto
                {
                    Id = a.Id,
                    Answer = a.Answer,
                    UserName = a.IsAdmin
                        ? "🛡️ TechStore"
                        : (aUser != null ? $"{aUser.FirstName} {aUser.LastName[0]}." : "Ẩn danh"),
                    IsAdmin = a.IsAdmin,
                    CreatedAt = a.CreatedAt
                };
            }).OrderBy(a => a.CreatedAt).ToList(),
            CreatedAt = result.CreatedAt
        };
    }
}
