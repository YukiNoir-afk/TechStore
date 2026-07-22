namespace EcommerceApi.DTOs.Support;

public class CreateSupportTicketRequest
{
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "QA";
}

public class ReplyTicketRequest
{
    public string Message { get; set; } = string.Empty;
}

public class UpdateTicketStatusRequest
{
    public string Status { get; set; } = string.Empty;
}
