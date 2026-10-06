import { HttpError } from "./asyncHandler.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MAX_QTY = 10;

export function toInt(v, label = "value") {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw new HttpError(400, `Invalid ${label}.`);
  return n;
}

export function parseCartItem(raw = {}) {
  const productId = toInt(raw.productId, "product");
  const size = String(raw.size ?? "").trim();
  const color = String(raw.color ?? "").trim();
  if (!size) throw new HttpError(400, "Please select a size.");
  if (!color) throw new HttpError(400, "Please select a color.");
  const quantity = raw.quantity === undefined ? 1 : toInt(raw.quantity, "quantity");
  if (quantity > MAX_QTY) throw new HttpError(400, `You can add at most ${MAX_QTY} of an item.`);
  return { productId, size, color, quantity };
}

export function parseShipping(raw = {}) {
  const s = {
    fullName: String(raw.fullName ?? "").trim(),
    email: String(raw.email ?? "").trim().toLowerCase(),
    phone: String(raw.phone ?? "").replace(/[\s-]/g, "").replace(/^\+91/, ""),
    address: String(raw.address ?? "").trim(),
    city: String(raw.city ?? "").trim(),
    state: String(raw.state ?? "").trim(),
    pincode: String(raw.pincode ?? "").trim(),
  };
  if (s.fullName.length < 2 || s.fullName.length > 100) throw new HttpError(400, "Please enter your full name.");
  if (!EMAIL_RE.test(s.email) || s.email.length > 150) throw new HttpError(400, "Please enter a valid email.");
  if (!/^[6-9]\d{9}$/.test(s.phone)) throw new HttpError(400, "Please enter a valid 10-digit mobile number.");
  if (s.address.length < 5 || s.address.length > 255) throw new HttpError(400, "Please enter your full address.");
  if (!s.city || s.city.length > 80) throw new HttpError(400, "Please enter your city.");
  if (!s.state || s.state.length > 80) throw new HttpError(400, "Please enter your state.");
  if (!/^\d{6}$/.test(s.pincode)) throw new HttpError(400, "Please enter a valid 6-digit pincode.");
  return s;
}

export function parsePayment(v) {
  const s = String(v ?? "").trim().toLowerCase();
  if (["cod", "cash on delivery"].includes(s)) return "COD";
  if (["demo online", "demo online payment", "online", "demo"].includes(s)) return "Demo Online";
  throw new HttpError(400, "Please choose a payment method.");
}
