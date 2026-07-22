using MongoDB.Driver;
using EcommerceApi.Data;
using EcommerceApi.Models;
using EcommerceApi.DTOs.Support;

namespace EcommerceApi.Services;

public class SupportService
{
    private readonly MongoDbContext _db;

    public SupportService(MongoDbContext db)
    {
        _db = db;
    }

    public async Task<SupportTicket> CreateTicket(string userId, CreateSupportTicketRequest request)
    {
        var ticket = new SupportTicket
        {
            UserId = userId,
            Subject = request.Subject,
            Message = request.Message,
            Type = request.Type
        };

        await _db.SupportTickets.InsertOneAsync(ticket);
        return ticket;
    }

    public async Task<List<SupportTicket>> GetUserTickets(string userId)
    {
        return await _db.SupportTickets.Find(t => t.UserId == userId)
            .SortByDescending(t => t.CreatedAt).ToListAsync();
    }

    public async Task<List<SupportTicket>> GetAllTickets()
    {
        return await _db.SupportTickets.Find(_ => true)
            .SortByDescending(t => t.CreatedAt).ToListAsync();
    }

    public async Task<SupportTicket> ReplyToTicket(string id, string userId, ReplyTicketRequest request, bool isAdmin)
    {
        var reply = new TicketResponse
        {
            Message = request.Message,
            RespondedBy = userId,
            IsAdmin = isAdmin,
            CreatedAt = DateTime.UtcNow
        };

        var update = Builders<SupportTicket>.Update
            .Push(t => t.Responses, reply)
            .Set(t => t.UpdatedAt, DateTime.UtcNow);

        if (isAdmin)
        {
            update = update.Set(t => t.Status, "InProgress");
        }

        var result = await _db.SupportTickets.FindOneAndUpdateAsync(
            t => t.Id == id, update,
            new FindOneAndUpdateOptions<SupportTicket> { ReturnDocument = ReturnDocument.After }
        );

        return result ?? throw new KeyNotFoundException("Ticket not found");
    }

    public async Task<SupportTicket> UpdateTicketStatus(string id, UpdateTicketStatusRequest request)
    {
        var update = Builders<SupportTicket>.Update
            .Set(t => t.Status, request.Status)
            .Set(t => t.UpdatedAt, DateTime.UtcNow);

        var result = await _db.SupportTickets.FindOneAndUpdateAsync(
            t => t.Id == id, update,
            new FindOneAndUpdateOptions<SupportTicket> { ReturnDocument = ReturnDocument.After }
        );

        return result ?? throw new KeyNotFoundException("Ticket not found");
    }
}
