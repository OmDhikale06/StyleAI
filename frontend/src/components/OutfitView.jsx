import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Stars from "./Stars.jsx";
import { useShop } from "../context/ShopContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { colorHex, inr, sortSizes } from "../utils/format.js";
import { resolveProductImage, resolveVariantImage } from "../utils/imageResolver.js";

const APPAREL = ["top", "bottom", "dress", "layer", "ethnic_top", "ethnic_bottom", "saree"];
const WEIGHTS = { occasion: 30, style: 20, gender: 15, budget: 15, color: 10, rating: 10 };
const LABELS = { occasion: "Occasion", style: "Style", gender: "Gender", budget: "Budget", color: "Color", rating: "Rating" };

// Renders an AI outfit. Handles per-item color/size selection and "Add Complete Look".
// anchorSel: for Complete-the-Look on a product page, the size/color the shopper already chose for that product.
export default function OutfitView({ outfit, anchorSel = null, onAdded, addLabel = "Add Complete Look" }) {
  const { addLookToCart } = useShop();
  const toast = useToast();
  const [sel, setSel] = useState({});
  const [missing, setMissing] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const next = {};
    for (const it of outfit.items) {
      if (it.fixed) continue;
      const colors = it.product.colors || [];
      const c = colors.find((x) => x.color === it.product.primary_color) || colors[0];
      next[it.product.id] = { color: c?.color || "", size: c && c.sizes.length === 1 ? c.sizes[0] : "" };
    }
    setSel(next); setMissing([]);
  }, [outfit]);

  const anchorOk = !!(anchorSel && anchorSel.size && anchorSel.color);
  const included = useMemo(() => outfit.items.filter((i) => !i.fixed || anchorOk), [outfit, anchorOk]);
  const total = included.reduce((s, i) => s + i.product.price, 0);
  const hasFixed = outfit.items.some((i) => i.fixed);

  const colorsOf = (it) => it.product.colors || [];
  const sizesFor = (it) => colorsOf(it).find((c) => c.color === sel[it.product.id]?.color)?.sizes || [];

  const setColor = (it, color) => {
    setSel((s) => {
      const cur = s[it.product.id] || {};
      const sizes = colorsOf(it).find((c) => c.color === color)?.sizes || [];
      return { ...s, [it.product.id]: { color, size: sizes.includes(cur.size) ? cur.size : sizes.length === 1 ? sizes[0] : "" } };
    });
  };
  const setSize = (it, size) => { setSel((s) => ({ ...s, [it.product.id]: { ...s[it.product.id], size } })); setMissing((m) => m.filter((x) => x !== it.product.id)); };

  const apparelItems = outfit.items.filter((i) => !i.fixed && APPAREL.includes(i.product.outfit_role));
  const quickSizes = sortSizes([...new Set(apparelItems.flatMap((i) => sizesFor(i)))].filter((s) => ["XS", "S", "M", "L", "XL", "XXL"].includes(s)));
  const applyAll = (size) => {
    setSel((s) => {
      const n = { ...s };
      for (const it of apparelItems) if (sizesFor(it).includes(size)) n[it.product.id] = { ...n[it.product.id], size };
      return n;
    });
    setMissing([]);
  };

  const addAll = async () => {
    const need = outfit.items.filter((i) => !i.fixed && (!sel[i.product.id]?.size || !sel[i.product.id]?.color)).map((i) => i.product.id);
    if (need.length) {
      setMissing(need);
      const name = outfit.items.find((i) => i.product.id === need[0]).product.name;
      return toast(need.length === 1 ? `Please select a size for ${name}.` : "Please select a size for each highlighted item.", "error");
    }
    const payload = included.map((i) => {
      const s = i.fixed ? anchorSel : sel[i.product.id];
      return { productId: i.product.id, size: s.size, color: s.color, quantity: 1 };
    });
    setBusy(true);
    const ok = await addLookToCart(payload);
    setBusy(false);
    if (ok) onAdded?.();
  };

  return (
    <div className="outfit">
      <div className="outfit-grid">
        {outfit.items.map((it) => {
          const p = it.product;
          const s = sel[p.id] || {};
          const colorObj = colorsOf(it).find((c) => c.color === s.color);
          const excluded = it.fixed && !anchorOk;
          return (
            <article key={p.id} className={`outfit-card ${missing.includes(p.id) ? "missing" : ""} ${excluded ? "excluded" : ""}`}>
              <Link to={`/product/${p.id}`} className="oc-media">
                <img src={resolveVariantImage(p, colorObj?.color || s.color) || resolveProductImage(p)} alt={p.name} loading="lazy" />
                <span className="oc-slot">{it.label}</span>
              </Link>
              <div className="oc-body">
                <span className="pc-brand">{p.brand}</span>
                <Link to={`/product/${p.id}`} className="pc-name">{p.name}</Link>
                <Stars rating={p.rating} count={p.review_count} />
                <div className="price-row"><span className="price">{inr(p.price)}</span><span className="mrp">{inr(p.original_price)}</span></div>

                {it.fixed ? (
                  <p className="oc-reason">{anchorOk ? `You selected: ${anchorSel.color}, size ${anchorSel.size}.` : "The item you're viewing. Choose its size and color above to include it."}</p>
                ) : (
                  <>
                    <p className="oc-reason"><span className="why">Why: </span>{it.reason}</p>
                    <div className="match"><div className="match-bar"><i style={{ width: `${Math.round(it.score)}%` }} /></div><span>{Math.round(it.score)}% match</span></div>
                    <details className="breakdown">
                      <summary>How this was scored</summary>
                      <ul>{Object.keys(WEIGHTS).map((k) => (<li key={k}><span>{LABELS[k]}</span><b>{it.breakdown[k]} / {WEIGHTS[k]}</b></li>))}</ul>
                    </details>
                    <div className="oc-pick">
                      <div className="swatches">{colorsOf(it).map((c) => (
                        <button key={c.color} className={`swatch ${s.color === c.color ? "on" : ""}`} style={{ background: colorHex(c.color) }} title={c.color} aria-label={c.color} onClick={() => setColor(it, c.color)} />
                      ))}</div>
                      <div className="chips">{sortSizes(sizesFor(it)).map((z) => (
                        <button key={z} className={`chip ${s.size === z ? "on" : ""}`} onClick={() => setSize(it, z)}>{z}</button>
                      ))}</div>
                    </div>
                    {it.alternatives?.length > 0 && (
                      <p className="oc-alt">Also consider: {it.alternatives.map((a, i) => (<span key={a.id}>{i > 0 && ", "}<Link to={`/product/${a.id}`}>{a.name}</Link> ({inr(a.price)})</span>))}</p>
                    )}
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="outfit-foot">
        <div className="outfit-total">
          <span className="muted small">{hasFixed ? "Total for this look" : "Look total"}</span>
          <strong>{inr(total)}</strong>
          {outfit.budget && !hasFixed && (outfit.within_budget
            ? <span className="pill ok">Within your {inr(outfit.budget)} budget</span>
            : <span className="pill warn">Over your {inr(outfit.budget)} budget</span>)}
        </div>
        {quickSizes.length > 1 && (
          <div className="quick-size"><span className="small muted">Apply size to all clothing:</span>
            {quickSizes.map((z) => <button key={z} className="chip" onClick={() => applyAll(z)}>{z}</button>)}
          </div>
        )}
        <button className="btn btn-primary btn-lg" onClick={addAll} disabled={busy}>{busy ? "Adding…" : addLabel}</button>
      </div>
    </div>
  );
}
