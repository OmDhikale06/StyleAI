// Single source of truth for cart/order totals. Prices always come from the database.
export const FREE_DELIVERY_ABOVE = 999;
export const DELIVERY_FEE = 79;

export function calculateTotals(lines) {
  let mrp = 0, selling = 0;
  for (const l of lines) {
    mrp += Number(l.original_price) * l.quantity;
    selling += Number(l.price) * l.quantity;
  }
  const discount = mrp - selling;
  const delivery = selling === 0 || selling >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  return {
    subtotal: round(mrp), discount: round(discount), delivery, total: round(selling + delivery),
    items: lines.reduce((n, l) => n + l.quantity, 0),
    free_delivery_above: FREE_DELIVERY_ABOVE,
  };
}
const round = (n) => Math.round(n * 100) / 100;
