// Central API client. Every request goes through here and uses VITE_API_URL.
export const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
if (!API_URL) console.error("VITE_API_URL is not set. Copy frontend/.env.example to frontend/.env and restart Vite.");

const TOKEN_KEY = "styleai_token";
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export async function api(path, { method = "GET", body, params } = {}) {
  let url = `${API_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") qs.set(k, v); });
    const s = qs.toString();
    if (s) url += `?${s}`;
  }
  const headers = { "Content-Type": "application/json" };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw Object.assign(new Error("Cannot reach the server. Please check your connection and try again."), { status: 0 });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) window.dispatchEvent(new Event("styleai:unauthorized"));
    throw Object.assign(new Error(data.message || "Something went wrong. Please try again."), { status: res.status });
  }
  return data;
}
