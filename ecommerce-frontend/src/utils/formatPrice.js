/**
 * Format a number as Vietnamese Dong (VND) currency.
 * Uses Intl.NumberFormat for locale-aware thousand separators.
 *
 * @param {number} price - The price value to format
 * @returns {string} Formatted price string, e.g. "1.250.000₫"
 */
export const formatPrice = (price) => {
  if (price == null || isNaN(price)) return '0₫';
  return new Intl.NumberFormat('vi-VN').format(Math.round(price)) + '₫';
};

export default formatPrice;
