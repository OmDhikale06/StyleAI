import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import ProductCard from "../components/ProductCard.jsx";
import { ErrorState, ProductGridSkeleton } from "../components/States.jsx";
import { HERO_IMAGE, OCCASIONS } from "../data/constants.js";

const STEPS = [
  { n: "1", title: "Tell us where you're going", text: "Pick an occasion, your style and your budget — or just type it in your own words." },
  { n: "2", title: "Get a complete outfit", text: "Our recommendation engine scores every product and assembles a full, colour-matched look." },
  { n: "3", title: "Shop it in one tap", text: "See exactly why each piece was chosen, then add the whole look to your cart." },
];

export default function Home() {
  const [trending, setTrending] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    setError(""); setTrending(null);
    api("/api/products", { params: { sort: "popularity", limit: 8 } }).then((d) => setTrending(d.products)).catch((e) => setError(e.message));
  };
  useEffect(load, []);

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">AI Personal Stylist</span>
            <h1>Discover Your Perfect Style.</h1>
            <p>AI-powered fashion recommendations tailored to you.</p>
            <div className="hero-cta">
              <Link to="/stylist" className="btn btn-primary btn-lg">Find My Style</Link>
              <Link to="/shop" className="btn btn-outline btn-lg">Shop Now</Link>
            </div>
            <ul className="hero-points">
              <li>Complete outfits, not just products</li>
              <li>Budget-aware &amp; occasion-aware</li>
              <li>Every pick explained</li>
            </ul>
          </div>
          <div className="hero-media"><img src={HERO_IMAGE} alt="Model wearing a StyleAI outfit" /></div>
        </div>
      </section>

      <section className="section container">
        <div className="section-head center">
          <h2>What are you dressing for today?</h2>
          <p className="muted">Choose an occasion and your AI stylist builds the look.</p>
        </div>
        <div className="occasion-grid">
          {OCCASIONS.map((o) => (
            <Link key={o.name} to={`/stylist?occasion=${encodeURIComponent(o.name)}`} className="occasion-card">
              <span className="occasion-emoji">{o.emoji}</span>
              <span>{o.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <h2>Trending now</h2>
          <Link to="/shop" className="link">View all →</Link>
        </div>
        {error ? <ErrorState message={error} onRetry={load} /> : !trending ? <ProductGridSkeleton /> : (
          <div className="product-grid">{trending.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        )}
      </section>

      <section className="section container">
        <div className="section-head center"><h2>How StyleAI works</h2></div>
        <div className="steps">
          {STEPS.map((s) => (
            <div key={s.n} className="step"><span className="step-n">{s.n}</span><h3>{s.title}</h3><p className="muted">{s.text}</p></div>
          ))}
        </div>
      </section>

      <section className="container">
        <div className="cta-band">
          <div>
            <h2>Tell StyleAI where you're going.</h2>
            <p>Your style and your budget — and StyleAI tells you what to wear.</p>
          </div>
          <Link to="/stylist" className="btn btn-light btn-lg">Meet your AI Stylist</Link>
        </div>
      </section>
    </>
  );
}
