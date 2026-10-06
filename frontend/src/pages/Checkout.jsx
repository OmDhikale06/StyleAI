import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useShop } from "../context/ShopContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { EmptyState, Spinner } from "../components/States.jsx";
import { inr } from "../utils/format.js";
import { resolveProductImage } from "../utils/imageResolver.js";

const STATES = ["Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal"];

function Field({ k, label, f, errs, set, ...rest }) {
  return (
    <label className={`field ${errs[k] ? "has-error" : ""}`}>{label}
      <input value={f[k]} onChange={set(k)} {...rest} />
      {errs[k] && <span className="form-error">{errs[k]}</span>}
    </label>
  );
}

export default function Checkout() {
  const { user } = useAuth();
  const { cart, loading, refresh } = useShop();
  const toast = useToast();
  const navigate = useNavigate();
  const [f, setF] = useState({ fullName: user?.name || "", email: user?.email || "", phone: "", address: "", city: "", state: "", pincode: "" });
  const [pay, setPay] = useState("COD");
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const { items, summary } = cart;
  const set = (k) => (e) => { setF((s) => ({ ...s, [k]: e.target.value })); setErrs((x) => ({ ...x, [k]: "" })); };

  if (loading && !items.length) return <div className="container"><Spinner label="Loading checkout…" /></div>;
  if (!items.length) return <div className="container"><EmptyState title="Your cart is empty." text="Add something to your cart before checking out." action={<Link className="btn btn-dark" to="/shop">Continue Shopping</Link>} /></div>;

  const validate = () => {
    const e = {};
    if (f.fullName.trim().length < 2) e.fullName = "Please enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "Please enter a valid email.";
    if (!/^[6-9]\d{9}$/.test(f.phone.replace(/[\s-]/g, "").replace(/^\+91/, ""))) e.phone = "Enter a valid 10-digit mobile number.";
    if (f.address.trim().length < 5) e.address = "Please enter your full address.";
    if (!f.city.trim()) e.city = "Please enter your city.";
    if (!f.state.trim()) e.state = "Please enter your state.";
    if (!/^\d{6}$/.test(f.pincode.trim())) e.pincode = "Enter a valid 6-digit pincode.";
    setErrs(e);
    return !Object.keys(e).length;
  };

  const place = async (e) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return toast("Please fix the highlighted fields.", "error");
    setBusy(true);
    try {
      const d = await api("/api/orders", { method: "POST", body: { shipping: f, paymentMethod: pay === "COD" ? "Cash on Delivery" : "Demo Online" } });
      await refresh();
      toast("Order placed successfully.");
      navigate(`/order-success/${d.order.orderId}`, { replace: true, state: { order: d.order } });
    } catch (err) {
      setServerError(err.message);
      refresh(); // stock may have changed
    } finally { setBusy(false); }
  };



  return (
    <div className="container">
      <h1 className="page-title">Checkout</h1>
      <form className="cart-layout" onSubmit={place} noValidate>
        <div>
          <section className="panel">
            <h2>Delivery address</h2>
            <div className="form-grid">
              <Field f={f} errs={errs} set={set} k="fullName" label="Full name" autoComplete="name" />
              <Field f={f} errs={errs} set={set} k="email" label="Email" type="email" autoComplete="email" />
              <Field f={f} errs={errs} set={set} k="phone" label="Phone" inputMode="tel" autoComplete="tel" placeholder="10-digit mobile number" />
              <Field f={f} errs={errs} set={set} k="pincode" label="Pincode" inputMode="numeric" maxLength={6} autoComplete="postal-code" />
              <div className="span2"><Field f={f} errs={errs} set={set} k="address" label="Address" autoComplete="street-address" placeholder="House no, street, area" /></div>
              <Field f={f} errs={errs} set={set} k="city" label="City" autoComplete="address-level2" />
              <label className={`field ${errs.state ? "has-error" : ""}`}>State
                <input list="states" value={f.state} onChange={set("state")} autoComplete="address-level1" />
                <datalist id="states">{STATES.map((s) => <option key={s} value={s} />)}</datalist>
                {errs.state && <span className="form-error">{errs.state}</span>}
              </label>
            </div>
          </section>

          <section className="panel">
            <h2>Payment</h2>
            <label className={`pay-option ${pay === "COD" ? "on" : ""}`}><input type="radio" name="pay" checked={pay === "COD"} onChange={() => setPay("COD")} /><div><b>Cash on Delivery</b><span className="muted small">Pay when your order arrives.</span></div></label>
            <label className={`pay-option ${pay === "Demo" ? "on" : ""}`}><input type="radio" name="pay" checked={pay === "Demo"} onChange={() => setPay("Demo")} /><div><b>Demo Online Payment</b><span className="muted small">Simulated payment — no card needed and nothing is charged.</span></div></label>
          </section>
        </div>

        <aside className="summary">
          <h2>Order summary</h2>
          <ul className="mini-items">
            {items.map((it) => (
              <li key={it.cart_id}><img src={resolveProductImage({ name: it.name, primary_color: it.selected_color })} alt="" /><div><span className="pc-name small">{it.name}</span><span className="muted small">{it.selected_color} · {it.selected_size} · Qty {it.quantity}</span></div><b>{inr(it.subtotal)}</b></li>
            ))}
          </ul>
          <div className="sum-row"><span>Subtotal</span><span>{inr(summary.subtotal)}</span></div>
          <div className="sum-row green"><span>Discount</span><span>− {inr(summary.discount)}</span></div>
          <div className="sum-row"><span>Delivery</span><span>{summary.delivery === 0 ? "Free" : inr(summary.delivery)}</span></div>
          <div className="sum-row total"><span>Grand Total</span><span>{inr(summary.total)}</span></div>
          {serverError && <p className="form-error" role="alert">{serverError}</p>}
          <button className="btn btn-primary btn-block btn-lg" disabled={busy}>{busy ? "Placing order…" : pay === "COD" ? "Place Order" : `Pay ${inr(summary.total)} (demo)`}</button>
          <Link to="/cart" className="btn btn-outline btn-block">Back to cart</Link>
        </aside>
      </form>
    </div>
  );
}
