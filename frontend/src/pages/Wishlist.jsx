import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useShop } from "../context/ShopContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { EmptyState, Spinner } from "../components/States.jsx";
import { colorHex, inr, sortSizes } from "../utils/format.js";
import { resolveProductImage } from "../utils/imageResolver.js";

function WishCard({ item }) {
  const { removeWishlistItem, moveWishlistToCart } = useShop();
  const toast = useToast();
  const [picker, setPicker] = useState(null); // null = closed, otherwise the product's colors
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [busy, setBusy] = useState(false);

  const open = async () => {
    try { setPicker((await api(`/api/products/${item.product_id}`)).product.colors); } catch (e) { toast(e.message, "error"); }
  };
  const confirm = async () => {
    if (!color) return toast("Please select a color.", "error");
    if (!size) return toast("Please select a size.", "error");
    setBusy(true);
    await moveWishlistToCart(item.wishlist_id, { size, color });
    setBusy(false);
  };
  const sizes = picker && color ? sortSizes(picker.find((c) => c.color === color).sizes.filter((s) => s.stock > 0).map((s) => s.size)) : [];

  return (
    <article className="product-card">
      <Link to={`/product/${item.product_id}`} className="pc-media"><img src={resolveProductImage({ name: item.name })} alt={item.name} loading="lazy" /></Link>
      <div className="pc-body">
        <span className="pc-brand">{item.brand}</span>
        <Link to={`/product/${item.product_id}`} className="pc-name">{item.name}</Link>
        <div className="price-row"><span className="price">{inr(item.price)}</span><span className="mrp">{inr(item.original_price)}</span><span className="off">{item.discount}% off</span></div>
        {!picker ? (
          <div className="row-gap">
            <button className="btn btn-dark btn-sm grow" onClick={open} disabled={item.stock < 1}>Move to Cart</button>
            <button className="btn btn-outline btn-sm" onClick={() => removeWishlistItem(item.wishlist_id)}>Remove</button>
          </div>
        ) : (
          <div className="mini-picker">
            <div className="swatches">{picker.map((c) => <button key={c.color} className={`swatch ${color === c.color ? "on" : ""}`} style={{ background: colorHex(c.color) }} title={c.color} aria-label={c.color} onClick={() => { setColor(c.color); setSize(""); }} />)}</div>
            <div className="chips">{sizes.map((s) => <button key={s} className={`chip ${size === s ? "on" : ""}`} onClick={() => setSize(s)}>{s}</button>)}</div>
            <div className="row-gap"><button className="btn btn-primary btn-sm grow" onClick={confirm} disabled={busy}>Add to cart</button><button className="btn btn-outline btn-sm" onClick={() => setPicker(null)}>Cancel</button></div>
          </div>
        )}
      </div>
    </article>
  );
}

export default function Wishlist() {
  const { user } = useAuth();
  const { wishlist, loading } = useShop();
  if (!user) return <div className="container"><EmptyState title="Login required." text="Log in to see your wishlist." action={<Link className="btn btn-dark" to="/login" state={{ from: "/wishlist" }}>Log in</Link>} /></div>;
  if (loading && !wishlist.length) return <div className="container"><Spinner label="Loading your wishlist…" /></div>;
  return (
    <div className="container">
      <h1 className="page-title">Your wishlist</h1>
      {!wishlist.length ? <EmptyState title="Your wishlist is empty." text="Tap the heart on any product to save it here." action={<Link className="btn btn-dark" to="/shop">Browse products</Link>} /> : (
        <div className="product-grid">{wishlist.map((w) => <WishCard key={w.wishlist_id} item={w} />)}</div>
      )}
    </div>
  );
}
