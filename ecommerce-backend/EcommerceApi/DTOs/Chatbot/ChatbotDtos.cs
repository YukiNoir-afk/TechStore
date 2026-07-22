namespace EcommerceApi.DTOs.Chatbot;

public class ChatMessageRequest
{
    public string Message { get; set; } = string.Empty;
}

public class ChatMessageResponse
{
    public string Reply { get; set; } = string.Empty;
    public string Type { get; set; } = "text"; // text, products, order, faq
    public List<ChatProductSuggestion>? Products { get; set; }
    public List<string>? QuickReplies { get; set; }
}

public class ChatProductSuggestion
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal? OriginalPrice { get; set; }
    public string? Image { get; set; }
    public decimal Rating { get; set; }
    public int Reviews { get; set; }
    public bool OnSale { get; set; }
    public int? Discount { get; set; }
}
