import { Link, useNavigate } from "react-router-dom";
import { HeartIcon } from "./Icons.jsx";
import Stars from "./Stars.jsx";
import { useShop } from "../context/ShopContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { inr } from "../utils/format.js";
import { resolveProductImage } from "../utils/imageResolver.js";

export default function ProductCard({ product: p }) {
  const { wishlistIds, toggleWishlist } = useShop();
  const toast = useToast();
  const navigate = useNavigate();
  const wished = wishlistIds.has(p.id);

  // Size and color are required, so "Add to Cart" takes the shopper to the product page to choose them
  const goChoose = () => { toast("Choose your size and color to add this to your cart.", "info"); navigate(`/product/${p.id}`); };

  return (
    <article className="product-card">
      <Link to={`/product/${p.id}`} className="pc-media" aria-label={p.name}>
        <img src={resolveProductImage(p)} alt={p.name} loading="lazy" />
        {p.discount > 0 && <span className="badge">{p.discount}% OFF</span>}
      </Link>
      <button className={`wish-btn ${wished ? "on" : ""}`} onClick={() => toggleWishlist(p.id)} aria-label={wished ? "Remove from wishlist" : "Add to wishlist"} aria-pressed={wished}>
        <HeartIcon filled={wished} />
      </button>
      <div className="pc-body">
        <span className="pc-brand">{p.brand}</span>
        <Link to={`/product/${p.id}`} className="pc-name">{p.name}</Link>
        <Stars rating={p.rating} count={p.review_count} />
        <div className="price-row">
          <span className="price">{inr(p.price)}</span>
          <span className="mrp">{inr(p.original_price)}</span>
          <span className="off">{p.discount}% off</span>
        </div>
        <button className="btn btn-dark btn-block" onClick={goChoose} disabled={p.stock < 1}>{p.stock < 1 ? "Out of stock" : "Add to Cart"}</button>
      </div>
    </article>
  );
}
