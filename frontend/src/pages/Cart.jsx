import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useShop } from "../context/ShopContext.jsx";
import { EmptyState, Spinner } from "../components/States.jsx";
import { colorHex, inr } from "../utils/format.js";
import { resolveProductImage } from "../utils/imageResolver.js";

export default function Cart() {
  const { user } = useAuth();
  const { cart, loading, updateQty, removeItem, cartToWishlist } = useShop();
  const { items, summary } = cart;

  if (!user) return <div className="container"><EmptyState title="Login required." text="Log in to see your cart." action={<Link className="btn btn-dark" to="/login" state={{ from: "/cart" }}>Log in</Link>} /></div>;
  if (loading && !items.length) return <div className="container"><Spinner label="Loading your cart…" /></div>;
  if (!items.length) return <div className="container"><EmptyState title="Your cart is empty." text="Let our AI stylist put together a look for you." action={<div className="row-gap"><Link className="btn btn-primary" to="/stylist">Find my style</Link><Link className="btn btn-outline" to="/shop">Continue Shopping</Link></div>} /></div>;

  const toFree = Math.max(0, summary.free_delivery_above - (summary.total - summary.delivery));

  return (
    <div className="container">
      <h1 className="page-title">Shopping cart <span className="muted">({summary.items} item{summary.items === 1 ? "" : "s"})</span></h1>
      <div className="cart-layout">
        <div className="cart-list">
          {items.map((it) => (
            <div key={it.cart_id} className="cart-item">
              <Link to={`/product/${it.product_id}`} className="ci-img"><img src={resolveProductImage({ name: it.name, primary_color: it.selected_color })} alt={it.name} /></Link>
              <div className="ci-main">
                <span className="pc-brand">{it.brand}</span>
                <Link to={`/product/${it.product_id}`} className="pc-name">{it.name}</Link>
                <div className="ci-meta">
                  <span>Size: <b>{it.selected_size}</b></span>
                  <span className="ci-color">Color: <i className="dot" style={{ background: colorHex(it.selected_color) }} /> <b>{it.selected_color}</b></span>
                </div>
                <div className="price-row"><span className="price">{inr(it.price)}</span><span className="mrp">{inr(it.original_price)}</span><span className="off">{it.discount}% off</span></div>
                <div className="ci-actions">
                  <div className="stepper sm">
                    <button onClick={() => updateQty(it.cart_id, it.quantity - 1)} disabled={it.quantity <= 1} aria-label="Decrease quantity">−</button>
                    <span>{it.quantity}</span>
                    <button onClick={() => updateQty(it.cart_id, it.quantity + 1)} disabled={it.quantity >= Math.min(it.variant_stock ?? 0, 10)} aria-label="Increase quantity">+</button>
                  </div>
                  <button className="link as-link" onClick={() => cartToWishlist(it.cart_id)}>Move to wishlist</button>
                  <button className="link as-link danger" onClick={() => removeItem(it.cart_id)}>Remove</button>
                </div>
              </div>
              <div className="ci-sub"><span className="muted small">Subtotal</span><strong>{inr(it.subtotal)}</strong></div>
            </div>
          ))}
        </div>

        <aside className="summary">
          <h2>Order summary</h2>
          <div className="sum-row"><span>Subtotal</span><span>{inr(summary.subtotal)}</span></div>
          <div className="sum-row green"><span>Discount</span><span>− {inr(summary.discount)}</span></div>
          <div className="sum-row"><span>Delivery</span><span>{summary.delivery === 0 ? "Free" : inr(summary.delivery)}</span></div>
          <div className="sum-row total"><span>Grand Total</span><span>{inr(summary.total)}</span></div>
          {toFree > 0 && <p className="nudge">Add {inr(toFree)} more for free delivery.</p>}
          <Link to="/checkout" className="btn btn-primary btn-block btn-lg">Proceed to Checkout</Link>
          <Link to="/shop" className="btn btn-outline btn-block">Continue Shopping</Link>
        </aside>
      </div>
    </div>
  );
}
