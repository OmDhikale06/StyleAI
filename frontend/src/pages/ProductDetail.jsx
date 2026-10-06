import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { useShop } from "../context/ShopContext.jsx";
import Stars from "../components/Stars.jsx";
import Reviews from "../components/Reviews.jsx";
import CompleteLook from "../components/CompleteLook.jsx";
import { HeartIcon } from "../components/Icons.jsx";
import { ErrorState, Spinner } from "../components/States.jsx";
import { colorHex, inr, sortSizes } from "../utils/format.js";
import { resolveProductGallery, resolveProductImage, resolveVariantImage } from "../utils/imageResolver.js";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, wishlistIds, toggleWishlist } = useShop();
  const [p, setP] = useState(null);
  const [error, setError] = useState("");
  const [main, setMain] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);

  const load = () => {
    setError(""); setP(null); setColor(""); setSize(""); setQty(1); setErrs({});
    api(`/api/products/${id}`).then((d) => { setP(d.product); setMain(resolveProductImage(d.product)); }).catch((e) => setError(e.message));
  };
  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const colorObj = useMemo(() => p?.colors.find((c) => c.color === color), [p, color]);
  const allSizes = useMemo(() => (p ? sortSizes([...new Set(p.colors.flatMap((c) => c.sizes.map((s) => s.size)))]) : []), [p]);
  const stockFor = (s) => (colorObj ? colorObj.sizes.find((x) => x.size === s)?.stock ?? 0 : Math.max(0, ...p.colors.map((c) => c.sizes.find((x) => x.size === s)?.stock ?? 0)));
  const variantStock = colorObj && size ? colorObj.sizes.find((x) => x.size === size)?.stock ?? 0 : null;
  const maxQty = Math.min(variantStock ?? 10, 10);

  const pickColor = (c) => {
    setColor(c.color); setErrs((e) => ({ ...e, color: "" }));
    setMain(resolveVariantImage(p, c.color));
    const still = c.sizes.find((s) => s.size === size);
    if (size && (!still || still.stock < 1)) setSize("");
    setQty(1);
  };
  const pickSize = (s) => { setSize(s); setErrs((e) => ({ ...e, size: "" })); setQty((q) => Math.min(q, 10)); };

  const validate = () => {
    const e = {};
    if (!color) e.color = "Please select a color.";
    if (!size) e.size = "Please select a size.";
    setErrs(e);
    return !Object.keys(e).length;
  };
  const add = async (buyNow) => {
    if (!validate()) return;
    setBusy(true);
    const ok = await addToCart({ productId: p.id, size, color, quantity: qty });
    setBusy(false);
    if (ok && buyNow) navigate("/checkout");
  };

  if (error) return <div className="container"><ErrorState message={error} onRetry={load} /></div>;
  if (!p) return <div className="container"><Spinner label="Loading product…" /></div>;

  const wished = wishlistIds.has(p.id);
  const out = p.stock < 1;
  const stockText = out ? "Out of stock" : variantStock === null ? "In stock" : variantStock < 1 ? "Out of stock" : variantStock <= 5 ? `Only ${variantStock} left` : "In stock";

  return (
    <div className="container pdp">
      <nav className="crumbs"><Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / <Link to={`/shop?category=${p.category_slug}`}>{p.category}</Link></nav>
      <div className="pdp-grid">
        <div className="gallery">
          <div className="gallery-main"><img src={main} alt={p.name} />{p.discount > 0 && <span className="badge">{p.discount}% OFF</span>}</div>
          <div className="thumbs">
            {resolveProductGallery(p).map((image, i) => (
              <button key={`${p.id}-${i}`} className={`thumb ${main === image ? "on" : ""}`} onClick={() => setMain(image)} aria-label={`View image ${i + 1}`}>
                <img src={image} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        <div className="info">
          <span className="pc-brand">{p.brand}</span>
          <h1>{p.name}</h1>
          <a href="#reviews" className="rating-link"><Stars rating={p.rating} count={p.review_count} size={16} /></a>
          <div className="price-row big">
            <span className="price">{inr(p.price)}</span>
            <span className="mrp">{inr(p.original_price)}</span>
            <span className="off">{p.discount}% off</span>
          </div>
          <p className="muted small">Inclusive of all taxes</p>
          <p className="desc">{p.description}</p>
          <div className="tags"><span className="tag">{p.style}</span>{p.occasion.split(",").map((o) => <span key={o} className="tag soft">{o}</span>)}</div>

          <div className="opt">
            <div className="opt-label">Color{color && <b>: {color}</b>}</div>
            <div className="swatches lg">
              {p.colors.map((c) => (
                <button key={c.color} className={`swatch ${color === c.color ? "on" : ""}`} style={{ background: colorHex(c.color) }} title={c.color} aria-label={c.color} aria-pressed={color === c.color} onClick={() => pickColor(c)} />
              ))}
            </div>
            {errs.color && <p className="form-error">{errs.color}</p>}
          </div>

          <div className="opt">
            <div className="opt-label">Size{size && <b>: {size}</b>}</div>
            <div className="chips">
              {allSizes.map((s) => (
                <button key={s} className={`chip lg ${size === s ? "on" : ""}`} disabled={stockFor(s) < 1} onClick={() => pickSize(s)} aria-pressed={size === s}>{s}</button>
              ))}
            </div>
            {errs.size && <p className="form-error">{errs.size}</p>}
          </div>

          <div className="opt row">
            <div>
              <div className="opt-label">Quantity</div>
              <div className="stepper">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease">−</button>
                <span>{qty}</span>
                <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} aria-label="Increase">+</button>
              </div>
            </div>
            <span className={`stock ${stockText === "In stock" ? "ok" : "low"}`}>{stockText}</span>
          </div>

          <div className="pdp-actions">
            <button className="btn btn-primary btn-lg" onClick={() => add(false)} disabled={busy || out}>Add to Cart</button>
            <button className="btn btn-dark btn-lg" onClick={() => add(true)} disabled={busy || out}>Buy Now</button>
            <button className={`btn btn-outline btn-lg wish-inline ${wished ? "on" : ""}`} onClick={() => toggleWishlist(p.id)} aria-pressed={wished}>
              <HeartIcon filled={wished} width={20} height={20} /> {wished ? "Wishlisted" : "Wishlist"}
            </button>
          </div>
          <ul className="perks"><li>Free delivery on orders above ₹999</li><li>Estimated delivery in 3–5 days</li><li>Cash on Delivery available</li></ul>
        </div>
      </div>

      <CompleteLook product={p} anchorSel={size && color ? { size, color } : null} />

      <Reviews productId={p.id} onSubmitted={load} />
    </div>
  );
}
