import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { fmtDate } from "../utils/format.js";
import Stars from "./Stars.jsx";
import { Link } from "react-router-dom";

export default function Reviews({ productId, onSubmitted }) {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api(`/api/products/${productId}/reviews`).then(setData).catch((e) => setError(e.message));
  }, [productId]);
  useEffect(() => { setData(null); load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return toast("Please choose a rating.", "error");
    setBusy(true);
    try {
      await api("/api/reviews", { method: "POST", body: { productId, rating, comment } });
      toast("Thanks for your review!");
      setRating(0); setComment(""); load(); onSubmitted?.();
    } catch (err) { toast(err.message, "error"); } finally { setBusy(false); }
  };

  return (
    <section className="reviews" id="reviews">
      <h2>Ratings &amp; Reviews</h2>
      {error && <p className="form-error">{error}</p>}
      {!data && !error && <p className="muted">Loading reviews…</p>}
      {data && (
        <div className="reviews-grid">
          <div className="review-list">
            {data.reviews.length === 0 && <p className="muted">No reviews yet. Be the first to review this product.</p>}
            {data.reviews.map((r) => (
              <div key={r.id} className="review">
                <div className="review-head"><Stars rating={r.rating} /><strong>{r.user_name}</strong><span className="muted">{fmtDate(r.created_at)}</span></div>
                <p>{r.comment}</p>
              </div>
            ))}
          </div>
          <div className="review-form-wrap">
            <h3>Write a review</h3>
            {user ? (
              <form onSubmit={submit} className="review-form">
                <div className="star-input" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button type="button" key={n} className={n <= rating ? "on" : ""} onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}>★</button>
                  ))}
                </div>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was the fit, fabric and quality?" rows={4} maxLength={1000} required minLength={5} />
                <button className="btn btn-dark" disabled={busy}>{busy ? "Submitting…" : "Submit review"}</button>
              </form>
            ) : (
              <p className="muted"><Link to="/login" state={{ from: `/product/${productId}` }}>Log in</Link> to write a review.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
