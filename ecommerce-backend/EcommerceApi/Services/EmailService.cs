using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using EcommerceApi.Models;

namespace EcommerceApi.Services;

public class EmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    // ── Order Confirmation ──────────────────────────────────────────────
    public async Task SendOrderConfirmationAsync(Order order, User user)
    {
        var subject = $"✅ Xác nhận đơn hàng #{order.Id} – TechStore";
        var body = BuildOrderConfirmationHtml(order, user);
        await SendAsync(user.Email, $"{user.FirstName} {user.LastName}", subject, body);
    }

    // ── Welcome Email ──────────────────────────────────────────────────────────
    public async Task SendWelcomeEmailAsync(User user)
    {
        var subject = "🎉 Chào mừng bạn đến với TechStore";
        var body = BuildWelcomeEmailHtml(user);
        await SendAsync(user.Email, $"{user.FirstName} {user.LastName}", subject, body);
    }

    // ── Password Reset ─────────────────────────────────────────────────────────
    public async Task SendPasswordResetAsync(User user, string token)
    {
        var subject = "🔑 Đặt lại mật khẩu – TechStore";
        var resetLink = $"http://localhost:3000/reset-password?token={token}";
        var body = BuildPasswordResetHtml(user, resetLink);
        await SendAsync(user.Email, $"{user.FirstName} {user.LastName}", subject, body);
    }

    // ── Order Status Update ─────────────────────────────────────────────
    public async Task SendOrderStatusUpdateAsync(Order order, User user)
    {
        var (emoji, statusVi) = order.Status switch
        {
            "Processing" => ("⚙️", "Đang xử lý"),
            "Shipped"    => ("🚚", "Đang vận chuyển"),
            "Delivered"  => ("📦", "Đã giao hàng"),
            "Cancelled"  => ("❌", "Đã hủy"),
            _            => ("📋", order.Status)
        };

        var subject = $"{emoji} Cập nhật đơn hàng #{order.Id}: {statusVi}";
        var body = BuildStatusUpdateHtml(order, user, statusVi, emoji);
        await SendAsync(user.Email, $"{user.FirstName} {user.LastName}", subject, body);
    }

    // ── Order Cancellation ────────────────────────────────────────────────
    public async Task SendOrderCancellationAsync(Order order, User user)
    {
        var subject = $"❌ Đơn hàng #{order.Id} đã bị hủy – TechStore";
        var body = BuildOrderCancellationHtml(order, user);
        await SendAsync(user.Email, $"{user.FirstName} {user.LastName}", subject, body);
    }

    // ── Check if email is configured ───────────────────────────────────────────
    public bool IsConfigured()
    {
        var fromEmail = _config["Email:From"];
        var password = _config["Email:Password"];
        return !string.IsNullOrEmpty(fromEmail) && !fromEmail.Contains("your-email", StringComparison.OrdinalIgnoreCase) &&
               !string.IsNullOrEmpty(password) && !password.Contains("your-gmail", StringComparison.OrdinalIgnoreCase);
    }

    // ── Core Send ──────────────────────────────────────────────────────────────
    private async Task SendAsync(string toEmail, string toName, string subject, string htmlBody)
    {
        var smtpHost = _config["Email:SmtpHost"];
        var smtpPort = int.Parse(_config["Email:SmtpPort"] ?? "587");
        var fromEmail = _config["Email:From"];
        var password = _config["Email:Password"];
        var displayName = _config["Email:DisplayName"] ?? "TechStore";

        // Skip if not configured
        if (string.IsNullOrEmpty(fromEmail) || fromEmail.Contains("your-email", StringComparison.OrdinalIgnoreCase) ||
            string.IsNullOrEmpty(password) || password.Contains("your-gmail", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Email not configured – skipping send to {Email}. Subject: {Subject}", toEmail, subject);
            return;
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(displayName, fromEmail));
            message.To.Add(new MailboxAddress(toName, toEmail));
            message.Subject = subject;
            message.Body = new TextPart("html") { Text = htmlBody };

            using var client = new SmtpClient();
            await client.ConnectAsync(smtpHost!, smtpPort, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(fromEmail, password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email sent to {Email}: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}: {Subject}", toEmail, subject);
            // Don't rethrow – email failure should not block the order process
        }
    }

    // ── HTML Templates ──────────────────────────────────────────────────
        return $@"<!DOCTYPE html>
<html lang='vi'>
<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'></head>
<body style='margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#f5f5f5;padding:40px 0;'>
    <tr><td align='center'>
      <table width='600' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);'>
        <!-- Header -->
        <tr><td style='background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:32px;text-align:center;'>
          <h1 style='color:#fff;margin:0;font-size:28px;letter-spacing:-0.5px;'>🛒 TechStore</h1>
          <p style='color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;'>Chào mừng bạn gia nhập!</p>
        </td></tr>

        <!-- Body -->
        <tr><td style='padding:32px;'>
          <h2 style='color:#1e293b;margin:0 0 8px;font-size:22px;'>Xin chào, {user.FirstName}! 👋</h2>
          <p style='color:#64748b;margin:0 0 24px;line-height:1.6;'>Cảm ơn bạn đã đăng ký tài khoản tại TechStore. Chúng tôi rất vui mừng được đồng hành cùng bạn trên hành trình mua sắm sắp tới.</p>

          <!-- Info Box -->
          <table width='100%' cellpadding='0' cellspacing='0' style='background:#f8faff;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;'>
            <tr><td style='padding:16px;'>
              <p style='color:#1e293b;margin:0;font-size:14px;'>Khám phá hàng ngàn sản phẩm công nghệ mới nhất với ưu đãi đặc biệt dành riêng cho thành viên.</p>
            </td></tr>
          </table>

          <!-- CTA Button -->
          <div style='text-align:center;margin:32px 0;'>
            <a href='http://localhost:3000/products'
               style='display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;'>
              🚀 Bắt đầu mua sắm ngay
            </a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style='background:#f8faff;padding:24px;text-align:center;border-top:1px solid #e2e8f0;'>
          <p style='color:#94a3b8;font-size:13px;margin:0;'>© 2024 TechStore — Trải nghiệm công nghệ đỉnh cao</p>
          <p style='color:#94a3b8;font-size:12px;margin:8px 0 0;'>Nếu có thắc mắc, hãy liên hệ: support@techstore.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>";
    }

    private static string BuildOrderConfirmationHtml(Order order, User user)
    {
        var itemsHtml = string.Join("", order.Items.Select(item => $@"
            <tr>
                <td style='padding:12px 16px;border-bottom:1px solid #f0f0f0;'>
                    <strong>{item.ProductName}</strong>
                    {(string.IsNullOrEmpty(item.ProductImage) ? "" : $"<br><img src='{item.ProductImage}' width='48' style='border-radius:4px;margin-top:4px;'/>")}
                </td>
                <td style='padding:12px 16px;border-bottom:1px solid #f0f0f0;text-align:center;'>{item.Quantity}</td>
                <td style='padding:12px 16px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;'>${(item.Price * item.Quantity):F2}</td>
            </tr>"));

        var shippingMethodLabel = order.ShippingMethod switch
        {
            "express"   => "Express (2-3 days) – $20.00",
            "overnight" => "Overnight – $40.00",
            _           => order.Subtotal > 50 ? "Standard (5-7 days) – FREE" : "Standard (5-7 days) – $10.00"
        };

        return $@"<!DOCTYPE html>
<html lang='vi'>
<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'></head>
<body style='margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#f5f5f5;padding:40px 0;'>
    <tr><td align='center'>
      <table width='600' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);'>
        <!-- Header -->
        <tr><td style='background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:32px;text-align:center;'>
          <h1 style='color:#fff;margin:0;font-size:28px;letter-spacing:-0.5px;'>🛍️ TechStore</h1>
          <p style='color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;'>Cảm ơn bạn đã mua hàng!</p>
        </td></tr>

        <!-- Body -->
        <tr><td style='padding:32px;'>
          <h2 style='color:#1e293b;margin:0 0 8px;font-size:22px;'>Xin chào, {user.FirstName}! 👋</h2>
          <p style='color:#64748b;margin:0 0 24px;'>Đơn hàng của bạn đã được xác nhận và đang được xử lý.</p>

          <!-- Order Info Box -->
          <table width='100%' cellpadding='0' cellspacing='0' style='background:#f8faff;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;'>
            <tr>
              <td style='padding:20px;'>
                <table width='100%'><tr>
                  <td><span style='color:#64748b;font-size:13px;'>Mã đơn hàng</span><br><strong style='color:#1e293b;font-size:16px;'>#{order.Id}</strong></td>
                  <td><span style='color:#64748b;font-size:13px;'>Ngày đặt</span><br><strong style='color:#1e293b;'>{order.CreatedAt:dd/MM/yyyy HH:mm}</strong></td>
                  <td><span style='color:#64748b;font-size:13px;'>Trạng thái</span><br><span style='background:#dbeafe;color:#1d4ed8;padding:2px 10px;border-radius:20px;font-size:13px;font-weight:600;'>Đang xử lý</span></td>
                </tr></table>
              </td>
            </tr>
          </table>

          <!-- Items Table -->
          <h3 style='color:#1e293b;margin:0 0 12px;font-size:16px;'>Sản phẩm đã đặt</h3>
          <table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;'>
            <thead>
              <tr style='background:#f8faff;'>
                <th style='padding:12px 16px;text-align:left;color:#64748b;font-size:13px;font-weight:600;'>Sản phẩm</th>
                <th style='padding:12px 16px;text-align:center;color:#64748b;font-size:13px;font-weight:600;'>SL</th>
                <th style='padding:12px 16px;text-align:right;color:#64748b;font-size:13px;font-weight:600;'>Thành tiền</th>
              </tr>
            </thead>
            <tbody>{itemsHtml}</tbody>
          </table>

          <!-- Totals -->
          <table width='100%' cellpadding='0' cellspacing='0' style='margin-bottom:24px;'>
            <tr><td style='padding:6px 0;color:#64748b;'>Tạm tính</td><td style='padding:6px 0;text-align:right;'>${order.Subtotal:F2}</td></tr>
            <tr><td style='padding:6px 0;color:#64748b;'>VAT (10%)</td><td style='padding:6px 0;text-align:right;'>${order.Tax:F2}</td></tr>
            <tr><td style='padding:6px 0;color:#64748b;'>Vận chuyển ({shippingMethodLabel})</td><td style='padding:6px 0;text-align:right;'>${order.ShippingCost:F2}</td></tr>
            <tr style='border-top:2px solid #e2e8f0;'>
              <td style='padding:12px 0 6px;font-weight:700;font-size:16px;color:#1e293b;'>Tổng cộng</td>
              <td style='padding:12px 0 6px;text-align:right;font-weight:700;font-size:18px;color:#2563eb;'>${order.Total:F2}</td>
            </tr>
          </table>

          <!-- Shipping Address -->
          <h3 style='color:#1e293b;margin:0 0 8px;font-size:16px;'>Địa chỉ giao hàng</h3>
          <p style='color:#64748b;background:#f8faff;padding:16px;border-radius:8px;margin:0 0 24px;line-height:1.6;'>
            {order.ShippingName}<br>
            {order.ShippingAddress}<br>
            {order.ShippingCity}, {order.ShippingState} {order.ShippingZipCode}<br>
            {order.ShippingCountry}
          </p>

          <!-- CTA -->
          <div style='text-align:center;'>
            <a href='http://localhost:3000/order-tracking/{order.Id}'
               style='display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;'>
              📦 Theo dõi đơn hàng
            </a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style='background:#f8faff;padding:24px;text-align:center;border-top:1px solid #e2e8f0;'>
          <p style='color:#94a3b8;font-size:13px;margin:0;'>© 2024 TechStore · Cảm ơn bạn đã tin tưởng mua sắm!</p>
          <p style='color:#94a3b8;font-size:12px;margin:8px 0 0;'>Nếu có thắc mắc, hãy liên hệ: support@techstore.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>";
    }

    private static string BuildStatusUpdateHtml(Order order, User user, string statusVi, string emoji)
    {
        var (bgColor, textColor) = order.Status switch
        {
            "Shipped"   => ("#f0fdf4", "#166534"),
            "Delivered" => ("#dcfce7", "#14532d"),
            "Cancelled" => ("#fef2f2", "#991b1b"),
            _           => ("#eff6ff", "#1e40af")
        };

        return $@"<!DOCTYPE html>
<html lang='vi'>
<head><meta charset='UTF-8'></head>
<body style='margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#f5f5f5;padding:40px 0;'>
    <tr><td align='center'>
      <table width='600' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);'>
        <tr><td style='background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:32px;text-align:center;'>
          <h1 style='color:#fff;margin:0;font-size:28px;'>🛍️ TechStore</h1>
          <p style='color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;'>Cập nhật trạng thái đơn hàng</p>
        </td></tr>
        <tr><td style='padding:32px;'>
          <h2 style='color:#1e293b;margin:0 0 8px;'>Xin chào, {user.FirstName}!</h2>
          <p style='color:#64748b;margin:0 0 24px;'>Đơn hàng #{order.Id} của bạn vừa được cập nhật trạng thái.</p>

          <div style='background:{bgColor};border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;'>
            <div style='font-size:48px;margin-bottom:12px;'>{emoji}</div>
            <h3 style='color:{textColor};margin:0;font-size:22px;'>{statusVi}</h3>
            {(order.Status == "Shipped" && !string.IsNullOrEmpty(order.TrackingNumber)
                ? $"<p style='color:{textColor};margin:8px 0 0;'>Mã tracking: <strong>{order.TrackingNumber}</strong></p>"
                : "")}
          </div>

          <table width='100%' cellpadding='0' cellspacing='0' style='background:#f8faff;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;'>
            <tr><td style='padding:20px;'>
              <table width='100%'><tr>
                <td><span style='color:#64748b;font-size:13px;'>Mã đơn</span><br><strong>#{order.Id}</strong></td>
                <td><span style='color:#64748b;font-size:13px;'>Tổng tiền</span><br><strong style='color:#2563eb;'>${order.Total:F2}</strong></td>
              </tr></table>
            </td></tr>
          </table>

          <div style='text-align:center;'>
            <a href='http://localhost:3000/order-tracking/{order.Id}'
               style='display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;'>
              Xem chi tiết đơn hàng
            </a>
          </div>
        </td></tr>
        <tr><td style='background:#f8faff;padding:24px;text-align:center;border-top:1px solid #e2e8f0;'>
          <p style='color:#94a3b8;font-size:13px;margin:0;'>© 2024 TechStore</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>";
    }

    // ── Password Reset Email Template ───────────────────────────────────
    private static string BuildPasswordResetHtml(User user, string resetLink)
    {
        return $@"<!DOCTYPE html>
<html lang='vi'>
<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'></head>
<body style='margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#f5f5f5;padding:40px 0;'>
    <tr><td align='center'>
      <table width='600' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);'>
        <!-- Header -->
        <tr><td style='background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:32px;text-align:center;'>
          <h1 style='color:#fff;margin:0;font-size:28px;letter-spacing:-0.5px;'>🛍️ TechStore</h1>
          <p style='color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;'>Đặt lại mật khẩu</p>
        </td></tr>

        <!-- Body -->
        <tr><td style='padding:32px;'>
          <h2 style='color:#1e293b;margin:0 0 8px;font-size:22px;'>Xin chào, {user.FirstName}! 👋</h2>
          <p style='color:#64748b;margin:0 0 24px;line-height:1.6;'>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn vào nút bên dưới để tạo mật khẩu mới.</p>

          <!-- Info Box -->
          <table width='100%' cellpadding='0' cellspacing='0' style='background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;margin-bottom:24px;'>
            <tr><td style='padding:16px;'>
              <p style='color:#92400e;margin:0;font-size:14px;'>⏰ Liên kết này sẽ hết hạn sau <strong>1 giờ</strong>. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
            </td></tr>
          </table>

          <!-- CTA Button -->
          <div style='text-align:center;margin:32px 0;'>
            <a href='{resetLink}'
               style='display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;'>
              🔑 Đặt lại mật khẩu
            </a>
          </div>

          <p style='color:#94a3b8;font-size:13px;margin:24px 0 0;line-height:1.6;'>Nếu nút không hoạt động, hãy sao chép và dán liên kết sau vào trình duyệt:<br>
            <a href='{resetLink}' style='color:#2563eb;word-break:break-all;'>{resetLink}</a>
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style='background:#f8faff;padding:24px;text-align:center;border-top:1px solid #e2e8f0;'>
          <p style='color:#94a3b8;font-size:13px;margin:0;'>© 2024 TechStore · Bảo mật tài khoản của bạn là ưu tiên hàng đầu</p>
          <p style='color:#94a3b8;font-size:12px;margin:8px 0 0;'>Nếu có thắc mắc, hãy liên hệ: support@techstore.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>";
    }

    // ── Order Cancellation Email Template ────────────────────────────────
    private static string BuildOrderCancellationHtml(Order order, User user)
    {
        var itemsHtml = string.Join("", order.Items.Select(item => $@"
            <tr>
                <td style='padding:10px 16px;border-bottom:1px solid #f0f0f0;'>
                    <strong>{item.ProductName}</strong>
                </td>
                <td style='padding:10px 16px;border-bottom:1px solid #f0f0f0;text-align:center;'>{item.Quantity}</td>
                <td style='padding:10px 16px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;'>${(item.Price * item.Quantity):F2}</td>
            </tr>"));

        return $@"<!DOCTYPE html>
<html lang='vi'>
<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'></head>
<body style='margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#f5f5f5;padding:40px 0;'>
    <tr><td align='center'>
      <table width='600' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);'>
        <!-- Header -->
        <tr><td style='background:linear-gradient(135deg,#dc2626,#b91c1c);padding:32px;text-align:center;'>
          <h1 style='color:#fff;margin:0;font-size:28px;letter-spacing:-0.5px;'>🛍️ TechStore</h1>
          <p style='color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;'>Thông báo hủy đơn hàng</p>
        </td></tr>

        <!-- Body -->
        <tr><td style='padding:32px;'>
          <h2 style='color:#1e293b;margin:0 0 8px;font-size:22px;'>Xin chào, {user.FirstName}! 👋</h2>
          <p style='color:#64748b;margin:0 0 24px;line-height:1.6;'>Đơn hàng <strong>#{order.Id}</strong> của bạn đã được hủy thành công. Chúng tôi rất tiếc vì bạn đã phải hủy đơn hàng này.</p>

          <!-- Cancelled Status Box -->
          <div style='background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;'>
            <div style='font-size:48px;margin-bottom:12px;'>❌</div>
            <h3 style='color:#991b1b;margin:0;font-size:22px;'>Đã hủy đơn hàng</h3>
            <p style='color:#b91c1c;margin:8px 0 0;font-size:14px;'>Đơn hàng #{order.Id} · {order.CreatedAt:dd/MM/yyyy HH:mm}</p>
          </div>

          <!-- Order Info Box -->
          <table width='100%' cellpadding='0' cellspacing='0' style='background:#f8faff;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px;'>
            <tr>
              <td style='padding:20px;'>
                <table width='100%'><tr>
                  <td><span style='color:#64748b;font-size:13px;'>Mã đơn hàng</span><br><strong style='color:#1e293b;font-size:16px;'>#{order.Id}</strong></td>
                  <td><span style='color:#64748b;font-size:13px;'>Tổng tiền</span><br><strong style='color:#2563eb;font-size:16px;'>${order.Total:F2}</strong></td>
                  <td><span style='color:#64748b;font-size:13px;'>Trạng thái</span><br><span style='background:#fee2e2;color:#991b1b;padding:2px 10px;border-radius:20px;font-size:13px;font-weight:600;'>Đã hủy</span></td>
                </tr></table>
              </td>
            </tr>
          </table>

          <!-- Items Table -->
          <h3 style='color:#1e293b;margin:0 0 12px;font-size:16px;'>Sản phẩm đã hủy</h3>
          <table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;'>
            <thead>
              <tr style='background:#f8faff;'>
                <th style='padding:10px 16px;text-align:left;color:#64748b;font-size:13px;font-weight:600;'>Sản phẩm</th>
                <th style='padding:10px 16px;text-align:center;color:#64748b;font-size:13px;font-weight:600;'>SL</th>
                <th style='padding:10px 16px;text-align:right;color:#64748b;font-size:13px;font-weight:600;'>Thành tiền</th>
              </tr>
            </thead>
            <tbody>{itemsHtml}</tbody>
          </table>

          <!-- Refund Notice -->
          <table width='100%' cellpadding='0' cellspacing='0' style='background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin-bottom:24px;'>
            <tr><td style='padding:16px;'>
              <p style='color:#166534;margin:0;font-size:14px;font-weight:600;'>💰 Thông tin hoàn tiền</p>
              <p style='color:#15803d;margin:8px 0 0;font-size:13px;line-height:1.6;'>Nếu bạn đã thanh toán, số tiền <strong>${order.Total:F2}</strong> sẽ được hoàn lại trong vòng 5-7 ngày làm việc tùy theo phương thức thanh toán.</p>
            </td></tr>
          </table>

          <!-- CTA -->
          <div style='text-align:center;'>
            <a href='http://localhost:3000/products'
               style='display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;'>
              🛒 Tiếp tục mua sắm
            </a>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style='background:#f8faff;padding:24px;text-align:center;border-top:1px solid #e2e8f0;'>
          <p style='color:#94a3b8;font-size:13px;margin:0;'>© 2024 TechStore · Cảm ơn bạn đã tin tưởng!</p>
          <p style='color:#94a3b8;font-size:12px;margin:8px 0 0;'>Nếu có thắc mắc, hãy liên hệ: support@techstore.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>";
    }
}
