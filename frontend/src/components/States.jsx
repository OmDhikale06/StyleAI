export function Spinner({ label = "Loading…" }) {
  return (
    <div className="state" role="status">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="state">
      <div className="state-icon">✦</div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state state-error" role="alert">
      <div className="state-icon">!</div>
      <h3>Something went wrong</h3>
      <p>{message}</p>
      {onRetry && <button className="btn btn-outline" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-skel"><div className="skel skel-img" /><div className="skel skel-line" /><div className="skel skel-line short" /></div>
      ))}
    </div>
  );
}
