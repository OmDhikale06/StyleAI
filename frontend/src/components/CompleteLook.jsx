import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import OutfitView from "./OutfitView.jsx";

export default function CompleteLook({ product, anchorSel }) {
  const [outfit, setOutfit] = useState(null);
  const [state, setState] = useState("loading");

  useEffect(() => {
    let alive = true;
    setState("loading"); setOutfit(null);
    api("/api/ai/complete-look", { method: "POST", body: { productId: product.id } })
      .then((d) => { if (alive) { setOutfit(d.outfit); setState("done"); } })
      .catch(() => alive && setState("none"));
    return () => { alive = false; };
  }, [product.id]);

  if (state === "none") return null;
  return (
    <section className="complete-look">
      <div className="section-head">
        <div>
          <h2>Complete Your Look</h2>
          <p className="muted">Our AI picked pieces that pair with this {product.category.toLowerCase().replace(/s$/, "")}.</p>
        </div>
      </div>
      {state === "loading" ? <div className="skel" style={{ height: 260 }} /> : (
        <>
          <OutfitView outfit={outfit} anchorSel={anchorSel} />
          <div className="why-box"><h3>Why these pieces?</h3><p>{outfit.explanation}</p></div>
        </>
      )}
    </section>
  );
}
