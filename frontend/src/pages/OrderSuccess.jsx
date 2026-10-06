import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { ErrorState, Spinner } from "../components/States.jsx";
import { inr } from "../utils/format.js";

export default function OrderSuccess() {
  const { id } = useParams();
  const { user } = useAuth();
  const { state } = useLocation();
  const [order, setOrder] = useState(state?.order ? { code: state.order.orderCode, total: state.order.totals.total, eta: state.order.estimatedDelivery } : null);
  const [error, setError] = useState("");

  // After a refresh the router state is gone, so load the order again
  useEffect(() => {
    if (order) return;
    api(`/api/orders/${user.id}/${id}`).then((d) => setOrder({ code: d.order.order_code, total: d.order.total, eta: "3–5 Days" })).catch((e) => setError(e.message));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <div className="container"><ErrorState message={error} /></div>;
  if (!order) return <div className="container"><Spinner /></div>;
  return (
    <div className="container">
      <div className="success-card">
        <div className="confetti">🎉</div>
        <h1>Order Placed Successfully!</h1>
        <p className="muted">Thank you for shopping with StyleAI.</p>
        <dl className="success-facts">
          <div><dt>Order ID</dt><dd>{order.code}</dd></div>
          <div><dt>Total paid / payable</dt><dd>{inr(order.total)}</dd></div>
          <div><dt>Estimated Delivery</dt><dd>{order.eta}</dd></div>
        </dl>
        <div className="row-gap">
          <Link to={`/orders/${id}`} className="btn btn-primary">View order</Link>
          <Link to="/orders" className="btn btn-outline">My Orders</Link>
          <Link to="/shop" className="btn btn-outline">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
