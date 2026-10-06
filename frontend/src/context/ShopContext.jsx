import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "./AuthContext.jsx";
import { useToast } from "./ToastContext.jsx";

const ShopContext = createContext(null);
export const useShop = () => useContext(ShopContext);

const EMPTY_CART = { items: [], summary: { subtotal: 0, discount: 0, delivery: 0, total: 0, items: 0, free_delivery_above: 999 } };

export function ShopProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [cart, setCart] = useState(EMPTY_CART);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) { setCart(EMPTY_CART); setWishlist([]); return; }
    setLoading(true);
    try {
      const [c, w] = await Promise.all([api(`/api/cart/${user.id}`), api(`/api/wishlist/${user.id}`)]);
      setCart({ items: c.items, summary: c.summary });
      setWishlist(w.items);
    } catch { /* surfaced by pages that need the data */ } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  // Returns true when logged in; otherwise sends the person to the login page and returns false
  const requireLogin = useCallback(() => {
    if (user) return true;
    toast("Login required.", "error");
    navigate("/login", { state: { from: location.pathname + location.search } });
    return false;
  }, [user, toast, navigate, location]);

  const applyCart = (data, message) => { setCart({ items: data.items, summary: data.summary }); if (message) toast(message); };

  const addToCart = async (item, message) => {
    if (!requireLogin()) return false;
    try { applyCart(await api("/api/cart", { method: "POST", body: item }), message || "Product added to cart."); return true; }
    catch (e) { toast(e.message, "error"); return false; }
  };
  const addLookToCart = async (items) => {
    if (!requireLogin()) return false;
    try { applyCart(await api("/api/cart/bulk", { method: "POST", body: { items } }), "Complete look added to cart."); return true; }
    catch (e) { toast(e.message, "error"); return false; }
  };
  const updateQty = async (cartId, quantity) => {
    try { applyCart(await api(`/api/cart/${cartId}`, { method: "PUT", body: { quantity } })); }
    catch (e) { toast(e.message, "error"); }
  };
  const removeItem = async (cartId) => {
    try { applyCart(await api(`/api/cart/${cartId}`, { method: "DELETE" }), "Item removed."); }
    catch (e) { toast(e.message, "error"); }
  };
  const cartToWishlist = async (cartId) => {
    try { applyCart(await api(`/api/cart/${cartId}/to-wishlist`, { method: "POST" }), "Moved to wishlist."); refresh(); }
    catch (e) { toast(e.message, "error"); }
  };

  const wishlistIds = useMemo(() => new Map(wishlist.map((w) => [w.product_id, w.wishlist_id])), [wishlist]);
  const toggleWishlist = async (productId) => {
    if (!requireLogin()) return;
    try {
      if (wishlistIds.has(productId)) {
        const d = await api(`/api/wishlist/${wishlistIds.get(productId)}`, { method: "DELETE" });
        setWishlist(d.items); toast("Removed from wishlist.");
      } else {
        const d = await api("/api/wishlist", { method: "POST", body: { productId } });
        setWishlist(d.items); toast("Added to wishlist.");
      }
    } catch (e) { toast(e.message, "error"); }
  };
  const removeWishlistItem = async (wishlistId) => {
    try { setWishlist((await api(`/api/wishlist/${wishlistId}`, { method: "DELETE" })).items); toast("Removed from wishlist."); }
    catch (e) { toast(e.message, "error"); }
  };
  const moveWishlistToCart = async (wishlistId, { size, color }) => {
    try {
      await api(`/api/wishlist/${wishlistId}/move-to-cart`, { method: "POST", body: { size, color, quantity: 1 } });
      toast("Moved to cart."); await refresh(); return true;
    } catch (e) { toast(e.message, "error"); return false; }
  };

  return (
    <ShopContext.Provider value={{
      cart, wishlist, loading, refresh, requireLogin, addToCart, addLookToCart, updateQty, removeItem, cartToWishlist,
      wishlistIds, toggleWishlist, removeWishlistItem, moveWishlistToCart,
    }}>
      {children}
    </ShopContext.Provider>
  );
}
