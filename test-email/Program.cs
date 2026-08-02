using System;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using System.Threading.Tasks;

class Program
{
    static async Task Main(string[] args)
    {
        Console.WriteLine("Starting email test...");
        var smtpHost = "smtp.gmail.com";
        var smtpPort = 587;
        var fromEmail = "buiphuc21705@gmail.com";
        var password = "fajxsdgcvcumbdhz";

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("TechStore", fromEmail));
            message.To.Add(new MailboxAddress("Test User", fromEmail));
            message.Subject = "Test Email from Console App";
            message.Body = new TextPart("plain") { Text = "This is a test email." };

            using var client = new SmtpClient();
            Console.WriteLine("Connecting...");
            await client.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.StartTls);
            Console.WriteLine("Authenticating...");
            await client.AuthenticateAsync(fromEmail, password);
            Console.WriteLine("Sending...");
            await client.SendAsync(message);
            Console.WriteLine("Disconnecting...");
            await client.DisconnectAsync(true);
            Console.WriteLine("Email sent successfully!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
            Console.WriteLine(ex.StackTrace);
        }
    }
}
