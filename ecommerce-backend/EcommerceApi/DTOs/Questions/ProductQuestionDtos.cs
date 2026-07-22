namespace EcommerceApi.DTOs.Questions;

public class CreateQuestionRequest
{
    public string Question { get; set; } = string.Empty;
}

public class CreateAnswerRequest
{
    public string Answer { get; set; } = string.Empty;
}

public class QuestionDto
{
    public string Id { get; set; } = string.Empty;
    public string Question { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public int AnswerCount { get; set; }
    public List<AnswerDto> Answers { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class AnswerDto
{
    public string Id { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public bool IsAdmin { get; set; }
    public DateTime CreatedAt { get; set; }
}
