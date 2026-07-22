// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * =====================================================
 * PLAYWRIGHT E2E TESTS - CHATBOT FUNCTIONALITY
 * =====================================================
 * Tests cover:
 *  1. Mở/đóng chatbot widget
 *  2. Hiển thị tin nhắn chào mừng
 *  3. Gửi tin nhắn và nhận phản hồi
 *  4. Quick replies (nút gợi ý nhanh)
 *  5. Hiển thị sản phẩm gợi ý
 *  6. Xử lý lỗi khi API không phản hồi
 *  7. Typing indicator
 *  8. Gửi nhiều tin nhắn liên tiếp
 * =====================================================
 */

// ==============================
// HELPER FUNCTIONS
// ==============================

/**
 * Mở chatbot widget bằng cách click vào FAB button
 */
async function openChatbot(page) {
  const fab = page.locator('.chatbot-fab');
  await fab.click();
  await expect(page.locator('.chatbot-container.chatbot-open')).toBeVisible();
}

/**
 * Gửi tin nhắn qua chatbot input
 */
async function sendMessage(page, message) {
  const input = page.locator('.chatbot-input');
  await input.fill(message);
  await page.locator('.chatbot-send-btn').click();
}

/**
 * Đợi bot phản hồi (typing indicator biến mất)
 */
async function waitForBotResponse(page, timeout = 15000) {
  // Đợi typing indicator xuất hiện
  await page.locator('.chatbot-typing-indicator').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  // Đợi typing indicator biến mất (bot đã trả lời)
  await page.locator('.chatbot-typing-indicator').waitFor({ state: 'hidden', timeout });
}


// ==============================
// TEST SUITE
// ==============================

test.describe('Chatbot - Chức năng Chatbot', () => {

  test.beforeEach(async ({ page }) => {
    // Truy cập trang chủ trước mỗi test
    await page.goto('/');
    // Đợi trang load xong
    await page.waitForLoadState('networkidle');
  });

  // --------------------------------------------------
  // TEST 1: Hiển thị FAB button chatbot
  // --------------------------------------------------
  test('TC01 - Hiển thị nút mở chatbot (FAB) trên trang', async ({ page }) => {
    const fab = page.locator('.chatbot-fab');
    await expect(fab).toBeVisible();
    
    // Kiểm tra FAB có icon chat
    const fabIcon = fab.locator('.chatbot-fab-icon svg');
    await expect(fabIcon).toBeVisible();
    
    // Kiểm tra chatbot container ban đầu không hiển thị (chưa mở)
    const container = page.locator('.chatbot-container.chatbot-open');
    await expect(container).not.toBeVisible();
  });

  // --------------------------------------------------
  // TEST 2: Mở chatbot
  // --------------------------------------------------
  test('TC02 - Mở chatbot khi click vào FAB button', async ({ page }) => {
    // Click FAB button
    await openChatbot(page);

    // Kiểm tra chatbot container hiển thị
    const container = page.locator('.chatbot-container.chatbot-open');
    await expect(container).toBeVisible();

    // Kiểm tra header hiển thị
    const header = page.locator('.chatbot-header');
    await expect(header).toBeVisible();

    // Kiểm tra tên assistant
    const headerTitle = page.locator('.chatbot-header-info h3');
    await expect(headerTitle).toHaveText('TechStore Assistant');

    // Kiểm tra trạng thái "Trực tuyến"
    const status = page.locator('.chatbot-status');
    await expect(status).toContainText('Trực tuyến');

    // Kiểm tra có input nhập tin nhắn
    const input = page.locator('.chatbot-input');
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute('placeholder', 'Nhập tin nhắn...');

    // FAB button biến mất khi chatbot mở
    const fab = page.locator('.chatbot-fab');
    await expect(fab).not.toBeVisible();
  });

  // --------------------------------------------------
  // TEST 3: Tin nhắn chào mừng
  // --------------------------------------------------
  test('TC03 - Hiển thị tin nhắn chào mừng khi mở chatbot lần đầu', async ({ page }) => {
    await openChatbot(page);

    // Đợi tin nhắn chào mừng xuất hiện
    const welcomeMessage = page.locator('.chatbot-message.bot .chatbot-msg-bubble').first();
    await expect(welcomeMessage).toBeVisible();

    // Kiểm tra nội dung chào mừng
    await expect(welcomeMessage).toContainText('Xin chào');
    await expect(welcomeMessage).toContainText('TechStore');

    // Kiểm tra có quick replies
    const quickReplies = page.locator('.chatbot-quick-replies').first();
    await expect(quickReplies).toBeVisible();

    // Kiểm tra có 5 quick reply buttons
    const quickReplyBtns = quickReplies.locator('.chatbot-quick-reply-btn');
    await expect(quickReplyBtns).toHaveCount(5);

    // Kiểm tra nội dung các quick reply
    await expect(quickReplyBtns.nth(0)).toContainText('Gợi ý sản phẩm');
    await expect(quickReplyBtns.nth(1)).toContainText('Sản phẩm giảm giá');
    await expect(quickReplyBtns.nth(2)).toContainText('Theo dõi đơn hàng');
    await expect(quickReplyBtns.nth(3)).toContainText('Chính sách giao hàng');
    await expect(quickReplyBtns.nth(4)).toContainText('Xem tất cả dịch vụ');
  });

  // --------------------------------------------------
  // TEST 4: Đóng chatbot
  // --------------------------------------------------
  test('TC04 - Đóng chatbot khi click nút close', async ({ page }) => {
    // Mở chatbot
    await openChatbot(page);
    await expect(page.locator('.chatbot-container.chatbot-open')).toBeVisible();

    // Click nút đóng
    const closeBtn = page.locator('.chatbot-close-btn');
    await closeBtn.click();

    // Chatbot đóng lại
    await expect(page.locator('.chatbot-container.chatbot-open')).not.toBeVisible();

    // FAB button xuất hiện lại
    const fab = page.locator('.chatbot-fab');
    await expect(fab).toBeVisible();
  });

  // --------------------------------------------------
  // TEST 5: Gửi tin nhắn
  // --------------------------------------------------
  test('TC05 - Gửi tin nhắn và nhận phản hồi từ bot', async ({ page }) => {
    await openChatbot(page);

    // Gửi tin nhắn
    const testMessage = 'Xin chào';
    await sendMessage(page, testMessage);

    // Kiểm tra tin nhắn người dùng xuất hiện
    const userMessages = page.locator('.chatbot-message.user .chatbot-msg-bubble');
    await expect(userMessages.last()).toContainText(testMessage);

    // Kiểm tra input đã bị xóa sau khi gửi
    const input = page.locator('.chatbot-input');
    await expect(input).toHaveValue('');

    // Đợi phản hồi từ bot
    await waitForBotResponse(page);

    // Kiểm tra có tin nhắn phản hồi từ bot (ít nhất 2 tin nhắn bot: welcome + reply)
    const botMessages = page.locator('.chatbot-message.bot .chatbot-msg-bubble');
    const count = await botMessages.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  // --------------------------------------------------
  // TEST 6: Typing indicator
  // --------------------------------------------------
  test('TC06 - Hiển thị typing indicator khi bot đang xử lý', async ({ page }) => {
    await openChatbot(page);

    // Gửi tin nhắn
    await sendMessage(page, 'Laptop giá rẻ');

    // Kiểm tra typing indicator xuất hiện
    const typingIndicator = page.locator('.chatbot-typing-indicator');
    await expect(typingIndicator).toBeVisible({ timeout: 5000 });

    // Kiểm tra có 3 dots animation
    const dots = typingIndicator.locator('span');
    await expect(dots).toHaveCount(3);

    // Kiểm tra input bị disable khi bot đang xử lý
    const input = page.locator('.chatbot-input');
    await expect(input).toBeDisabled();

    // Đợi bot trả lời xong
    await waitForBotResponse(page);

    // Typing indicator biến mất
    await expect(typingIndicator).not.toBeVisible();

    // Input hoạt động lại
    await expect(input).toBeEnabled();
  });

  // --------------------------------------------------
  // TEST 7: Quick reply
  // --------------------------------------------------
  test('TC07 - Click quick reply gửi tin nhắn tương ứng', async ({ page }) => {
    await openChatbot(page);

    // Đợi welcome message và quick replies xuất hiện
    const quickReplyBtns = page.locator('.chatbot-quick-replies .chatbot-quick-reply-btn');
    await expect(quickReplyBtns.first()).toBeVisible();

    // Click quick reply "Gợi ý sản phẩm"
    const firstQuickReply = quickReplyBtns.nth(0);
    const quickReplyText = await firstQuickReply.textContent();
    await firstQuickReply.click();

    // Kiểm tra tin nhắn user được gửi đi với nội dung quick reply
    const userMessages = page.locator('.chatbot-message.user .chatbot-msg-bubble');
    await expect(userMessages.last()).toContainText(quickReplyText || '');

    // Đợi phản hồi từ bot
    await waitForBotResponse(page);

    // Bot phải phản hồi lại
    const botMessages = page.locator('.chatbot-message.bot .chatbot-msg-bubble');
    const count = await botMessages.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  // --------------------------------------------------
  // TEST 8: Không gửi tin nhắn trống
  // --------------------------------------------------
  test('TC08 - Không cho gửi tin nhắn trống', async ({ page }) => {
    await openChatbot(page);

    // Input trống - nút gửi phải bị disable
    const sendBtn = page.locator('.chatbot-send-btn');
    await expect(sendBtn).toBeDisabled();

    // Nhập khoảng trắng
    const input = page.locator('.chatbot-input');
    await input.fill('   ');

    // Nút gửi vẫn disable vì chỉ có khoảng trắng
    await expect(sendBtn).toBeDisabled();

    // Nhập nội dung hợp lệ
    await input.fill('Hello');
    await expect(sendBtn).toBeEnabled();

    // Xóa nội dung
    await input.fill('');
    await expect(sendBtn).toBeDisabled();
  });

  // --------------------------------------------------
  // TEST 9: Gợi ý sản phẩm giảm giá
  // --------------------------------------------------
  test('TC09 - Hỏi về sản phẩm giảm giá và nhận gợi ý', async ({ page }) => {
    await openChatbot(page);

    // Click quick reply "Sản phẩm giảm giá"
    const quickReplyBtns = page.locator('.chatbot-quick-replies .chatbot-quick-reply-btn');
    await expect(quickReplyBtns.nth(1)).toBeVisible();
    await quickReplyBtns.nth(1).click();

    // Đợi phản hồi
    await waitForBotResponse(page);

    // Kiểm tra bot phản hồi 
    const lastBotMessage = page.locator('.chatbot-message.bot').last();
    await expect(lastBotMessage).toBeVisible();
    
    // Bot nên trả về phản hồi với nội dung
    const botBubble = lastBotMessage.locator('.chatbot-msg-bubble');
    await expect(botBubble).toBeVisible();
    const text = await botBubble.textContent();
    expect(text?.length).toBeGreaterThan(0);
  });

  // --------------------------------------------------
  // TEST 10: Gửi nhiều tin nhắn liên tiếp
  // --------------------------------------------------
  test('TC10 - Gửi nhiều tin nhắn liên tiếp', async ({ page }) => {
    await openChatbot(page);

    // Gửi tin nhắn 1
    await sendMessage(page, 'Xin chào');
    await waitForBotResponse(page);

    // Gửi tin nhắn 2
    await sendMessage(page, 'Laptop giá rẻ');
    await waitForBotResponse(page);

    // Gửi tin nhắn 3
    await sendMessage(page, 'Chính sách giao hàng');
    await waitForBotResponse(page);

    // Kiểm tra tổng số tin nhắn user: 3
    const userMessages = page.locator('.chatbot-message.user');
    await expect(userMessages).toHaveCount(3);

    // Kiểm tra tổng số tin nhắn bot: welcome + 3 replies = 4
    const botMessages = page.locator('.chatbot-message.bot');
    const botCount = await botMessages.count();
    expect(botCount).toBeGreaterThanOrEqual(4);
  });

  // --------------------------------------------------
  // TEST 11: Avatar bot hiển thị
  // --------------------------------------------------
  test('TC11 - Hiển thị avatar cho tin nhắn bot', async ({ page }) => {
    await openChatbot(page);

    // Welcome message phải có avatar
    const botAvatar = page.locator('.chatbot-message.bot .chatbot-msg-avatar').first();
    await expect(botAvatar).toBeVisible();

    // Avatar chứa SVG icon
    const avatarSvg = botAvatar.locator('svg');
    await expect(avatarSvg).toBeVisible();
  });

  // --------------------------------------------------
  // TEST 12: Tin nhắn user không có avatar
  // --------------------------------------------------
  test('TC12 - Tin nhắn người dùng không có avatar', async ({ page }) => {
    await openChatbot(page);

    // Gửi tin nhắn
    await sendMessage(page, 'Test message');

    // Tin nhắn user không có avatar
    const userMessage = page.locator('.chatbot-message.user').last();
    const userAvatar = userMessage.locator('.chatbot-msg-avatar');
    await expect(userAvatar).toHaveCount(0);
  });

  // --------------------------------------------------
  // TEST 13: Mở lại chatbot giữ lại tin nhắn cũ
  // --------------------------------------------------
  test('TC13 - Mở lại chatbot giữ lại lịch sử tin nhắn', async ({ page }) => {
    // Mở chatbot, gửi tin nhắn
    await openChatbot(page);
    await sendMessage(page, 'Hello chatbot');
    await waitForBotResponse(page);

    // Đếm số tin nhắn
    const messagesBefore = await page.locator('.chatbot-message').count();

    // Đóng chatbot
    await page.locator('.chatbot-close-btn').click();
    await expect(page.locator('.chatbot-container.chatbot-open')).not.toBeVisible();

    // Mở lại
    await openChatbot(page);

    // Số tin nhắn phải giữ nguyên
    const messagesAfter = await page.locator('.chatbot-message').count();
    expect(messagesAfter).toBe(messagesBefore);
  });

  // --------------------------------------------------
  // TEST 14: Gửi tin nhắn bằng phím Enter
  // --------------------------------------------------
  test('TC14 - Gửi tin nhắn bằng phím Enter', async ({ page }) => {
    await openChatbot(page);

    // Nhập tin nhắn
    const input = page.locator('.chatbot-input');
    await input.fill('Test Enter');

    // Nhấn Enter để gửi
    await input.press('Enter');

    // Kiểm tra tin nhắn user xuất hiện
    const userMessages = page.locator('.chatbot-message.user .chatbot-msg-bubble');
    await expect(userMessages.last()).toContainText('Test Enter');

    // Input phải bị xóa
    await expect(input).toHaveValue('');
  });

  // --------------------------------------------------
  // TEST 15: Xử lý lỗi API
  // --------------------------------------------------
  test('TC15 - Hiển thị thông báo lỗi khi API không phản hồi', async ({ page }) => {
    await openChatbot(page);

    // Mock API trả về lỗi
    await page.route('**/api/v1/chatbot/message', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    // Gửi tin nhắn
    await sendMessage(page, 'Test lỗi');

    // Đợi phản hồi lỗi
    await page.waitForTimeout(2000);

    // Kiểm tra thông báo lỗi xuất hiện
    const errorMessage = page.locator('.chatbot-message.bot .chatbot-msg-bubble').last();
    await expect(errorMessage).toContainText('Xin lỗi');

    // Kiểm tra quick reply "Thử lại" xuất hiện
    const quickReplies = page.locator('.chatbot-message.bot').last().locator('.chatbot-quick-reply-btn');
    const texts = await quickReplies.allTextContents();
    const hasRetry = texts.some(t => t.includes('Thử lại'));
    expect(hasRetry).toBeTruthy();
  });

  // --------------------------------------------------
  // TEST 16: Hỏi về chính sách giao hàng
  // --------------------------------------------------
  test('TC16 - Hỏi về chính sách giao hàng', async ({ page }) => {
    await openChatbot(page);

    // Click quick reply "Chính sách giao hàng"
    const quickReplyBtns = page.locator('.chatbot-quick-replies .chatbot-quick-reply-btn');
    await expect(quickReplyBtns.nth(3)).toBeVisible();
    await quickReplyBtns.nth(3).click();

    // Đợi phản hồi
    await waitForBotResponse(page);

    // Bot phản hồi có nội dung
    const lastBotBubble = page.locator('.chatbot-message.bot .chatbot-msg-bubble').last();
    await expect(lastBotBubble).toBeVisible();
    const text = await lastBotBubble.textContent();
    expect(text?.length).toBeGreaterThan(10);
  });

  // --------------------------------------------------
  // TEST 17: Auto-scroll khi có tin nhắn mới
  // --------------------------------------------------
  test('TC17 - Tự động cuộn xuống khi có tin nhắn mới', async ({ page }) => {
    await openChatbot(page);

    // Gửi nhiều tin nhắn để tạo scroll
    for (let i = 0; i < 3; i++) {
      await sendMessage(page, `Tin nhắn test số ${i + 1}`);
      await waitForBotResponse(page);
    }

    // Kiểm tra tin nhắn cuối cùng visible (auto-scroll hoạt động)
    const lastMessage = page.locator('.chatbot-message').last();
    await expect(lastMessage).toBeVisible();
  });

  // --------------------------------------------------
  // TEST 18: Focus input khi mở chatbot
  // --------------------------------------------------
  test('TC18 - Focus vào ô nhập tin nhắn khi mở chatbot', async ({ page }) => {
    await openChatbot(page);

    // Đợi animation và focus
    await page.waitForTimeout(500);

    // Input phải được focus
    const input = page.locator('.chatbot-input');
    await expect(input).toBeFocused();
  });

  // --------------------------------------------------
  // TEST 19: Hỏi về dịch vụ
  // --------------------------------------------------
  test('TC19 - Click "Xem tất cả dịch vụ" hiển thị danh sách', async ({ page }) => {
    await openChatbot(page);

    // Click quick reply cuối cùng
    const quickReplyBtns = page.locator('.chatbot-quick-replies .chatbot-quick-reply-btn');
    await expect(quickReplyBtns.nth(4)).toBeVisible();
    await quickReplyBtns.nth(4).click();

    // Đợi phản hồi
    await waitForBotResponse(page);

    // Bot phản hồi có nội dung
    const lastBotBubble = page.locator('.chatbot-message.bot .chatbot-msg-bubble').last();
    await expect(lastBotBubble).toBeVisible();
  });

  // --------------------------------------------------
  // TEST 20: Hiển thị sản phẩm khi bot gợi ý
  // --------------------------------------------------
  test('TC20 - Hiển thị card sản phẩm khi bot gợi ý sản phẩm', async ({ page }) => {
    await openChatbot(page);

    // Mock API trả về sản phẩm
    await page.route('**/api/v1/chatbot/message', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reply: 'Đây là một số sản phẩm phù hợp:',
          type: 'products',
          products: [
            {
              id: '1',
              name: 'Laptop Test ABC',
              price: 15000000,
              originalPrice: 18000000,
              image: '/images/laptop.jpg',
              rating: 4.5,
              reviews: 120,
              onSale: true,
              discount: 15,
            },
            {
              id: '2',
              name: 'Điện thoại Test XYZ',
              price: 8000000,
              originalPrice: null,
              image: '/images/phone.jpg',
              rating: 4.2,
              reviews: 85,
              onSale: false,
              discount: null,
            },
          ],
          quickReplies: ['Xem thêm', 'Tìm loại khác'],
        }),
      });
    });

    // Gửi tin nhắn
    await sendMessage(page, 'Gợi ý laptop');

    // Đợi phản hồi (không dùng waitForBotResponse vì API bị mock)
    await page.waitForTimeout(2000);

    // Kiểm tra product cards xuất hiện
    const productCards = page.locator('.chatbot-product-card');
    await expect(productCards).toHaveCount(2);

    // Kiểm tra tên sản phẩm
    const productNames = page.locator('.chatbot-product-name');
    await expect(productNames.nth(0)).toContainText('Laptop Test ABC');
    await expect(productNames.nth(1)).toContainText('Điện thoại Test XYZ');

    // Kiểm tra giá hiển thị
    const prices = page.locator('.chatbot-product-price');
    await expect(prices.first()).toBeVisible();

    // Kiểm tra rating hiển thị
    const ratings = page.locator('.chatbot-product-rating');
    await expect(ratings.first()).toBeVisible();

    // Kiểm tra badge giảm giá cho sản phẩm đầu tiên
    const badge = page.locator('.chatbot-product-badge');
    await expect(badge).toHaveCount(1);
    await expect(badge.first()).toContainText('-15%');

    // Kiểm tra product card là link có href đúng
    const firstCard = productCards.first();
    await expect(firstCard).toHaveAttribute('href', '/products/1');
  });

});
