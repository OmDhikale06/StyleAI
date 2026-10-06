import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { EmptyState, ErrorState, Spinner } from "../components/States.jsx";
import { fmtDate, inr } from "../utils/format.js";

export const StatusBadge = ({ status }) => <span className={`status status-${status.toLowerCase()}`}>{status}</span>;

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const load = () => { setError(""); api(`/api/orders/${user.id}`).then((d) => setOrders(d.orders)).catch((e) => setError(e.message)); };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <div className="container"><ErrorState message={error} onRetry={load} /></div>;
  if (!orders) return <div className="container"><Spinner label="Loading your orders…" /></div>;
  return (
    <div className="container">
      <h1 className="page-title">My Orders</h1>
      {!orders.length ? <EmptyState title="No orders yet." text="When you place an order, it will show up here." action={<Link className="btn btn-dark" to="/shop">Start shopping</Link>} /> : (
        <div className="orders-list">
          {orders.map((o) => (
            <Link key={o.id} to={`/orders/${o.id}`} className="order-row">
              <div><span className="muted small">Order ID</span><b>{o.order_code}</b></div>
              <div><span className="muted small">Date</span><b>{fmtDate(o.created_at)}</b></div>
              <div><span className="muted small">Items</span><b>{o.item_count}</b></div>
              <div><span className="muted small">Total</span><b>{inr(o.total)}</b></div>
              <div><StatusBadge status={o.status} /></div>
              <span className="chev">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
