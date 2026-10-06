import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import ProductCard from "../components/ProductCard.jsx";
import { EmptyState, ErrorState, ProductGridSkeleton } from "../components/States.jsx";
import { PRICE_RANGES, SORTS } from "../data/constants.js";
import { colorHex, sortSizes } from "../utils/format.js";

const csv = (v) => (v ? v.split(",").filter(Boolean) : []);
const FILTER_KEYS = ["gender", "category", "minPrice", "maxPrice", "size", "color", "brand", "rating", "style", "occasion"];

function Group({ title, children, open = true }) {
  return (
    <details className="fgroup" open={open}>
      <summary>{title}</summary>
      <div className="fgroup-body">{children}</div>
    </details>
  );
}

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [opts, setOpts] = useState(null);
  const [cats, setCats] = useState([]);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const key = params.toString();

  useEffect(() => {
    api("/api/products/filter-options").then(setOpts).catch(() => {});
    api("/api/categories").then((d) => setCats(d.categories.filter((c) => !["men", "women"].includes(c.slug)))).catch(() => {});
  }, []);

  const load = () => {
    setError(""); setData(null);
    api("/api/products", { params: { ...Object.fromEntries(params.entries()), limit: 12 } }).then(setData).catch((e) => setError(e.message));
  };
  useEffect(load, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (patch) => {
    const n = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v === "" || v == null ? n.delete(k) : n.set(k, v)));
    if (!("page" in patch)) n.delete("page");
    setParams(n);
  };
  const toggle = (k, val) => {
    const cur = csv(params.get(k));
    update({ [k]: (cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val]).join(",") });
  };
  const has = (k, val) => csv(params.get(k)).includes(val);
  const activeCount = useMemo(() => FILTER_KEYS.filter((k) => params.get(k)).length, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const clearAll = () => { const n = new URLSearchParams(); if (params.get("q")) n.set("q", params.get("q")); if (params.get("sort")) n.set("sort", params.get("sort")); setParams(n); };

  const range = PRICE_RANGES.findIndex((r) => (params.get("minPrice") || "") === r.min && (params.get("maxPrice") || "") === r.max);
  const q = params.get("q");
  const sizes = opts ? sortSizes(opts.sizes) : [];

  const Check = ({ k, v, label }) => (
    <label className="check"><input type="checkbox" checked={has(k, v)} onChange={() => toggle(k, v)} /><span>{label || v}</span></label>
  );

  return (
    <div className="container shop">
      <div className="shop-top">
        <div>
          <h1 className="page-title">{q ? <>Results for “{q}”</> : "Shop"}</h1>
          {data && <p className="muted">{data.pagination.total} product{data.pagination.total === 1 ? "" : "s"}</p>}
        </div>
        <div className="shop-tools">
          <button className="btn btn-outline btn-sm filter-toggle" onClick={() => setShowFilters(true)}>Filters{activeCount ? ` (${activeCount})` : ""}</button>
          <label className="sort">Sort by
            <select value={params.get("sort") || "popularity"} onChange={(e) => update({ sort: e.target.value })}>
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="shop-layout">
        <aside className={`filters ${showFilters ? "open" : ""}`}>
          <div className="filters-head">
            <strong>Filters</strong>
            <div>
              {activeCount > 0 && <button className="link as-link" onClick={clearAll}>Clear all</button>}
              <button className="btn btn-dark btn-sm filter-close" onClick={() => setShowFilters(false)}>Show results</button>
            </div>
          </div>

          <Group title="Gender">
            {["", "Men", "Women"].map((g) => (
              <label className="check" key={g || "all"}><input type="radio" name="gender" checked={(params.get("gender") || "") === g} onChange={() => update({ gender: g })} /><span>{g || "All"}</span></label>
            ))}
          </Group>
          <Group title="Category">{cats.map((c) => <Check key={c.slug} k="category" v={c.slug} label={c.name} />)}</Group>
          <Group title="Price">
            <label className="check"><input type="radio" name="price" checked={range === -1} onChange={() => update({ minPrice: "", maxPrice: "" })} /><span>Any price</span></label>
            {PRICE_RANGES.map((r, i) => (
              <label className="check" key={r.label}><input type="radio" name="price" checked={range === i} onChange={() => update({ minPrice: r.min, maxPrice: r.max })} /><span>{r.label}</span></label>
            ))}
          </Group>
          <Group title="Size"><div className="chips">{sizes.map((s) => <button key={s} className={`chip ${has("size", s) ? "on" : ""}`} onClick={() => toggle("size", s)}>{s}</button>)}</div></Group>
          <Group title="Color">
            <div className="swatches">
              {(opts?.colors || []).map((c) => (
                <button key={c} className={`swatch ${has("color", c) ? "on" : ""}`} style={{ background: colorHex(c) }} title={c} aria-label={c} aria-pressed={has("color", c)} onClick={() => toggle("color", c)} />
              ))}
            </div>
          </Group>
          <Group title="Brand" open={false}>{(opts?.brands || []).map((b) => <Check key={b} k="brand" v={b} />)}</Group>
          <Group title="Rating" open={false}>
            {["", "4", "3"].map((r) => (
              <label className="check" key={r || "any"}><input type="radio" name="rating" checked={(params.get("rating") || "") === r} onChange={() => update({ rating: r })} /><span>{r ? `${r}★ & above` : "Any rating"}</span></label>
            ))}
          </Group>
          <Group title="Style" open={false}>{(opts?.styles || []).map((s) => <Check key={s} k="style" v={s} />)}</Group>
          <Group title="Occasion" open={false}>{(opts?.occasions || []).map((o) => <Check key={o} k="occasion" v={o} />)}</Group>
        </aside>
        {showFilters && <div className="scrim" onClick={() => setShowFilters(false)} />}

        <section className="shop-results">
          {error ? <ErrorState message={error} onRetry={load} /> : !data ? <ProductGridSkeleton count={6} /> : data.products.length === 0 ? (
            <EmptyState title="No products found." text="Try removing a filter or searching for something else." action={<button className="btn btn-dark" onClick={clearAll}>Clear filters</button>} />
          ) : (
            <>
              <div className="product-grid">{data.products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
              {data.pagination.pages > 1 && (
                <div className="pager">
                  <button className="btn btn-outline btn-sm" disabled={data.pagination.page <= 1} onClick={() => update({ page: String(data.pagination.page - 1) })}>← Previous</button>
                  <span className="muted">Page {data.pagination.page} of {data.pagination.pages}</span>
                  <button className="btn btn-outline btn-sm" disabled={data.pagination.page >= data.pagination.pages} onClick={() => update({ page: String(data.pagination.page + 1) })}>Next →</button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
