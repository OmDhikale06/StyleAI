export default function Stars({ rating = 0, count, size = 14 }) {
  const pct = Math.max(0, Math.min(100, (Number(rating) / 5) * 100));
  return (
    <span className="stars" title={`${Number(rating).toFixed(1)} out of 5`}>
      <span className="stars-track" style={{ fontSize: size }} aria-hidden="true">
        ★★★★★<span className="stars-fill" style={{ width: `${pct}%` }}>★★★★★</span>
      </span>
      <span className="stars-num">{Number(rating).toFixed(1)}</span>
      {count !== undefined && <span className="stars-count">({Number(count).toLocaleString("en-IN")})</span>}
    </span>
  );
}
