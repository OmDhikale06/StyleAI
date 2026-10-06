import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ErrorState, Spinner } from "../components/States.jsx";
import { StatusBadge } from "./Orders.jsx";
import { fmtDate, inr } from "../utils/format.js";
import { resolveProductImage } from "../utils/imageResolver.js";

const FLOW = ["Placed", "Processing", "Shipped", "Delivered"];

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [o, setO] = useState(null);
  const [error, setError] = useState("");
  const load = () => { setError(""); api(`/api/orders/${user.id}/${id}`).then((d) => setO(d.order)).catch((e) => setError(e.message)); };
  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <div className="container"><ErrorState message={error} onRetry={load} /></div>;
  if (!o) return <div className="container"><Spinner label="Loading order…" /></div>;
  const stage = FLOW.indexOf(o.status);

  return (
    <div className="container">
      <p className="crumbs"><Link to="/orders">← My Orders</Link></p>
      <div className="od-head"><h1 className="page-title" style={{ margin: 0 }}>Order {o.order_code}</h1><StatusBadge status={o.status} /></div>
      <p className="muted">Placed on {fmtDate(o.created_at)} · {o.payment_method === "COD" ? "Cash on Delivery" : "Demo Online Payment"}</p>

      <ol className="timeline">{FLOW.map((s, i) => <li key={s} className={i <= stage ? "done" : ""}><span>{i <= stage ? "✓" : i + 1}</span>{s}</li>)}</ol>

      <div className="cart-layout">
        <div className="panel">
          <h2>Items</h2>
          {o.items.map((it) => (
            <div key={it.id} className="od-item">
              <Link to={`/product/${it.product_id}`}><img src={resolveProductImage({ name: it.product_name, primary_color: it.selected_color })} alt={it.product_name} /></Link>
              <div><Link to={`/product/${it.product_id}`} className="pc-name">{it.product_name}</Link><p className="muted small">{it.selected_color} · Size {it.selected_size} · Qty {it.quantity}</p></div>
              <b>{inr(it.subtotal)}</b>
            </div>
          ))}
        </div>
        <aside className="summary">
          <h2>Summary</h2>
          <div className="sum-row"><span>Subtotal</span><span>{inr(o.subtotal)}</span></div>
          <div className="sum-row green"><span>Discount</span><span>− {inr(o.discount)}</span></div>
          <div className="sum-row"><span>Delivery</span><span>{o.delivery_fee === 0 ? "Free" : inr(o.delivery_fee)}</span></div>
          <div className="sum-row total"><span>Total</span><span>{inr(o.total)}</span></div>
          <h3 style={{ marginTop: 18 }}>Delivering to</h3>
          <p className="muted small">{o.full_name}<br />{o.address}<br />{o.city}, {o.state} {o.pincode}<br />{o.phone}</p>
        </aside>
      </div>
    </div>
  );
}
