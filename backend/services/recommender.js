// Content-based, explainable outfit recommender. Pure functions: pass products in, get an outfit out.
import { defaultStylesFor } from "./nlpParser.js";

export const WEIGHTS = { gender: 15, occasion: 30, style: 20, budget: 15, color: 10, rating: 10 };

const RELATED_OCC = {
  College: ["Casual","Travel"], Casual: ["College","Travel","Date"], Office: ["Interview","Formal Event"], Interview: ["Office","Formal Event"],
  "Formal Event": ["Office","Interview","Wedding"], Party: ["Date"], Date: ["Party","Casual"], Wedding: ["Festival","Formal Event"],
  Festival: ["Wedding"], Travel: ["Casual","College"], Gym: [],
};
const RELATED_STYLE = {
  "Smart Casual": ["Casual","Formal","Minimal"], Casual: ["Smart Casual","Minimal","Trendy"], Formal: ["Smart Casual","Elegant"],
  Minimal: ["Smart Casual","Casual","Elegant"], Elegant: ["Formal","Minimal","Party"], Trendy: ["Streetwear","Party","Casual"],
  Streetwear: ["Trendy","Casual"], Party: ["Trendy","Elegant"], Sporty: ["Casual"], Traditional: ["Elegant"],
};
const NEUTRALS = ["Black","White","Grey","Beige","Navy"];

const SLOTS = {
  top: { roles: ["top"], share: 0.28 }, bottom: { roles: ["bottom"], share: 0.27 }, dress: { roles: ["dress"], share: 0.55 },
  shoes: { roles: ["shoes"], share: 0.28 }, accessory: { roles: ["accessory"], share: 0.12, optional: true },
  bag: { roles: ["bag"], share: 0.12, optional: true }, layer: { roles: ["layer"], share: 0.25, optional: true },
  ethnic_top: { roles: ["ethnic_top"], share: 0.4 }, ethnic_bottom: { roles: ["ethnic_bottom"], share: 0.14 },
  saree: { roles: ["saree"], share: 0.6 },
};
const SLOT_LABEL = { top: "Top", bottom: "Bottom", dress: "Dress", shoes: "Shoes", accessory: "Accessory", bag: "Bag", layer: "Layer", ethnic_top: "Ethnic wear", ethnic_bottom: "Ethnic bottom", saree: "Saree" };

export function basesFor(occasion, gender, season) {
  let bases;
  const ethnic = occasion === "Wedding" || occasion === "Festival";
  if (ethnic) bases = gender === "Women" ? [["saree","shoes","accessory"], ["ethnic_top","shoes","accessory"]] : [["ethnic_top","ethnic_bottom","shoes","accessory"]];
  else if (occasion === "Gym") bases = [["top","bottom","shoes","bag"]];
  else if (occasion === "College" || occasion === "Travel") bases = [["top","bottom","shoes","bag"]];
  else bases = [["top","bottom","shoes","accessory"]];
  if (!ethnic && gender === "Women" && occasion !== "Gym") {
    bases.push(["dress","shoes", occasion === "College" || occasion === "Travel" ? "bag" : "accessory"]);
  }
  if (season === "Winter" && !ethnic && occasion !== "Gym") bases = bases.map((b) => [...b, "layer"]);
  return bases;
}

const OCC_PHRASE = { Interview: "an interview", College: "college", "College Presentation": "a college presentation", Office: "the office", Casual: "casual outings", Party: "a party", Date: "a date", Wedding: "a wedding", Festival: "festive occasions", Travel: "travel", Gym: "the gym", "Formal Event": "a formal event" };
const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
const split = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);

function genderScore(p, gender) {
  if (!gender) return 0.8;
  if (p.gender === gender) return 1;
  if (p.gender === "Unisex") return 0.8;
  return 0;
}
function occasionScore(p, occ) {
  const list = split(p.occasion);
  if (list.includes(occ)) return 1;
  if ((RELATED_OCC[occ] || []).some((o) => list.includes(o))) return 0.35;
  return 0;
}
function styleScore(p, styles) {
  let best = 0;
  styles.slice(0, 3).forEach((s, i) => {
    const w = [1, 0.8, 0.6][i];
    if (p.style === s) best = Math.max(best, w);
    else if ((RELATED_STYLE[s] || []).includes(p.style)) best = Math.max(best, 0.5 * w);
  });
  return best;
}
function budgetScore(price, share) {
  if (!share) return 0.7;
  if (price <= share) return 0.8 + 0.2 * (price / share);
  return Math.max(0, 1 - (0.7 * (price - share)) / share);
}
function pairScore(p, chosen) {
  if (!chosen.length) return 0.6;
  const palette = split(p.color_palette);
  let total = 0;
  for (const c of chosen) {
    const cp = split(c.color_palette);
    if (p.primary_color === c.primary_color) total += NEUTRALS.includes(p.primary_color) ? 0.6 : 0.4;
    else if (cp.includes(p.primary_color) || palette.includes(c.primary_color)) total += 1;
    else if (NEUTRALS.includes(p.primary_color) || NEUTRALS.includes(c.primary_color)) total += 0.5;
  }
  return total / chosen.length;
}
function colorScore(p, prefColor, chosen) {
  const harmony = pairScore(p, chosen);
  if (!prefColor) return harmony;
  const pref = p.primary_color === prefColor ? 1 : split(p.color_palette).includes(prefColor) ? 0.6 : 0;
  return 0.6 * pref + 0.4 * harmony;
}

const FIT_WORDS = { Slim: ["slim","tailored","fitted","tapered"], Relaxed: ["relaxed","loose","drape","straight"], Oversized: ["oversized","boxy","baggy","drop-shoulder"], Regular: ["regular","straight","classic","essential"] };
function tweak(p, prefs) {
  // Small tie-break adjustments for season and fit (at most a few points)
  let t = 0;
  const text = `${p.name} ${p.description || ""}`.toLowerCase();
  if (prefs.season === "Summer") { if (/linen|lightweight|breathable|dry|cotton/.test(text)) t += 2; if (p.outfit_role === "layer") t -= 3; }
  if (prefs.season === "Winter") { if (p.outfit_role === "layer" || /fleece|hoodie|jacket|trench/.test(text)) t += 3; if (/linen|crop/.test(text)) t -= 2; }
  if (prefs.season === "Monsoon" && /water-resistant|quick|dry/.test(text)) t += 3;
  if (prefs.fit && ["top","bottom","layer","dress"].includes(p.outfit_role) && (FIT_WORDS[prefs.fit] || []).some((w) => text.includes(w))) t += 2;
  return t;
}

export function scoreProduct(p, prefs, ctx) {
  const comp = {
    gender: genderScore(p, prefs.gender),
    occasion: occasionScore(p, prefs.occasion),
    style: styleScore(p, prefs.styles),
    budget: budgetScore(Number(p.price), ctx.share),
    color: colorScore(p, prefs.color, ctx.chosen || []),
    rating: Math.min(1, Number(p.rating) / 5),
  };
  const breakdown = {};
  let total = 0;
  for (const k of Object.keys(WEIGHTS)) { breakdown[k] = +(comp[k] * WEIGHTS[k]).toFixed(1); total += comp[k] * WEIGHTS[k]; }
  total = Math.max(0, Math.min(100, total + tweak(p, prefs)));
  return { score: +total.toFixed(1), breakdown, comp };
}

function reasonFor(p, prefs, sc, ctx) {
  const bits = [];
  if (sc.comp.occasion === 1) bits.push(`suits ${prefs.occasionLabel || prefs.occasion}`);
  else if (sc.comp.occasion > 0) bits.push(`works for ${prefs.occasion.toLowerCase()} settings`);
  if (sc.comp.style >= 0.99) bits.push(`${p.style} style`);
  else if (sc.comp.style > 0) bits.push(`${p.style} style close to your ${prefs.styles[0]} preference`);
  if (prefs.color && p.primary_color === prefs.color) bits.push(`comes in your preferred ${prefs.color}`);
  else if (ctx.chosen?.length && sc.comp.color >= 0.8) bits.push(`${p.primary_color} pairs well with the ${ctx.chosen[0].primary_color} ${ctx.chosen[0].name.toLowerCase()}`);
  if (ctx.share) bits.push(p.price <= ctx.share ? `${inr(p.price)} fits your ~${inr(ctx.share)} share of the budget` : `${inr(p.price)} is slightly above its ~${inr(ctx.share)} budget share`);
  bits.push(`rated ${Number(p.rating).toFixed(1)}★ by ${p.review_count.toLocaleString("en-IN")} shoppers`);
  const s = bits.join("; ");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}

const brief = (p, extra = {}) => ({
  id: p.id, name: p.name, brand: p.brand, price: Number(p.price), original_price: Number(p.original_price), discount: p.discount,
  rating: Number(p.rating), review_count: p.review_count, image: p.image, primary_color: p.primary_color, category: p.category,
  style: p.style, outfit_role: p.outfit_role, ...extra,
});

function buildForBase(products, prefs, base, fixed) {
  const budget = prefs.budget || null;
  const totalShare = base.reduce((s, k) => s + SLOTS[k].share, 0);
  const shareOf = (k) => (budget ? (budget * SLOTS[k].share) / totalShare : null);
  const picks = []; // {slot, product, fixed}
  const used = new Set(fixed.map((f) => f.id));
  const slotOfFixed = {};
  for (const f of fixed) {
    const k = base.find((s) => SLOTS[s].roles.includes(f.outfit_role) && !slotOfFixed[s]);
    if (k) slotOfFixed[k] = f;
    picks.push({ slot: k || f.outfit_role, product: f, fixed: true });
  }
  const chosenProducts = () => picks.map((p) => p.product);
  const candidatesFor = (k) => {
    let c = products.filter((p) => SLOTS[k].roles.includes(p.outfit_role) && !used.has(p.id) && genderScore(p, prefs.gender) > 0);
    const exact = c.filter((p) => occasionScore(p, prefs.occasion) === 1);
    return exact.length ? exact : c;
  };
  const order = [...base].filter((k) => !slotOfFixed[k]).sort((a, b) => (SLOTS[a].optional ? 1 : 0) - (SLOTS[b].optional ? 1 : 0) || SLOTS[b].share - SLOTS[a].share);
  const ranked = {};
  for (const k of order) {
    const ctx = { share: shareOf(k), chosen: chosenProducts() };
    const scored = candidatesFor(k).map((p) => ({ p, ...scoreProduct(p, prefs, ctx) })).sort((a, b) => b.score - a.score || b.p.rating - a.p.rating);
    if (!scored.length) { if (!SLOTS[k].optional) return null; continue; }
    picks.push({ slot: k, product: scored[0].p, fixed: false, ctx });
    used.add(scored[0].p.id);
    ranked[k] = scored;
  }
  // Budget repair: swap to cheaper alternatives with the smallest score loss per rupee saved, then drop optional items
  const total = () => picks.reduce((s, p) => s + Number(p.product.price), 0);
  for (let i = 0; budget && total() > budget && i < 25; i++) {
    let bestSwap = null;
    for (const pk of picks) {
      if (pk.fixed || !ranked[pk.slot]) continue;
      const cur = ranked[pk.slot].find((r) => r.p.id === pk.product.id);
      for (const alt of ranked[pk.slot]) {
        if (used.has(alt.p.id) || Number(alt.p.price) >= Number(pk.product.price)) continue;
        const saving = Number(pk.product.price) - Number(alt.p.price);
        const loss = Math.max(0.1, (cur?.score || 0) - alt.score) / saving;
        if (!bestSwap || loss < bestSwap.loss) bestSwap = { pk, alt, loss };
      }
    }
    if (!bestSwap) break;
    used.delete(bestSwap.pk.product.id); used.add(bestSwap.alt.p.id);
    bestSwap.pk.product = bestSwap.alt.p;
  }
  for (const k of ["layer", "bag", "accessory"]) {
    if (budget && total() > budget) {
      const idx = picks.findIndex((p) => p.slot === k && !p.fixed);
      if (idx !== -1) picks.splice(idx, 1);
    }
  }
  // Final scoring in context of the finished outfit
  const items = picks.map((pk) => {
    const others = picks.filter((o) => o !== pk).map((o) => o.product);
    const ctx = { share: shareOf(pk.slot) ?? null, chosen: others };
    const sc = scoreProduct(pk.product, prefs, ctx);
    const alternatives = (ranked[pk.slot] || []).filter((r) => r.p.id !== pk.product.id).slice(0, 2).map((r) => brief(r.p, { score: r.score }));
    return {
      slot: pk.slot, label: SLOT_LABEL[pk.slot] || pk.slot, fixed: pk.fixed,
      product: brief(pk.product), score: pk.fixed ? null : sc.score, breakdown: pk.fixed ? null : sc.breakdown,
      reason: pk.fixed ? "The item you selected." : reasonFor(pk.product, prefs, sc, ctx), alternatives,
    };
  });
  items.sort((a, b) => base.indexOf(a.slot) - base.indexOf(b.slot));
  const scored = items.filter((i) => i.score !== null);
  const sum = items.reduce((s, i) => s + i.product.price, 0);
  return {
    items, total: sum, budget, within_budget: !budget || sum <= budget,
    avg_score: scored.length ? +(scored.reduce((s, i) => s + i.score, 0) / scored.length).toFixed(1) : 0,
  };
}

export function explain(prefs, outfit) {
  const colors = [...new Set(outfit.items.map((i) => i.product.primary_color))];
  const parts = [`matches your ${prefs.styles.slice(0, 2).join(" / ").toLowerCase()} style`, `is appropriate for ${OCC_PHRASE[prefs.occasionLabel] || OCC_PHRASE[prefs.occasion] || prefs.occasion.toLowerCase()}`];
  if (outfit.budget) parts.push(outfit.within_budget ? `stays within your ${inr(outfit.budget)} budget at ${inr(outfit.total)}` : `comes to ${inr(outfit.total)}, slightly above your ${inr(outfit.budget)} budget (the closest match we could find)`);
  const palette = colors.length > 1 ? `uses a coordinated ${colors.join(", ").toLowerCase()} palette` : null;
  if (palette) parts.push(palette);
  if (prefs.color && colors.includes(prefs.color)) parts.push(`features your preferred ${prefs.color.toLowerCase()}`);
  const last = parts.pop();
  return `Recommended because this outfit ${parts.length ? parts.join(", ") + " and " : ""}${last}.`;
}

export function buildOutfit(products, input, { fixed = [] } = {}) {
  const styles = input.styles?.length ? input.styles : defaultStylesFor(input.occasion);
  const prefs = { ...input, styles };
  const available = products.filter((p) => p.stock > 0);
  let best = null;
  for (const base of basesFor(prefs.occasion, prefs.gender, prefs.season)) {
    if (fixed.length && !fixed.every((f) => base.some((s) => SLOTS[s].roles.includes(f.outfit_role)))) continue;
    const o = buildForBase(available, prefs, base, fixed);
    if (!o) continue;
    const better = !best || (o.within_budget && !best.within_budget) || (o.within_budget === best.within_budget && o.avg_score > best.avg_score);
    if (better) best = o;
  }
  if (!best && fixed.length) best = buildForBase(available, prefs, basesFor(prefs.occasion, prefs.gender, prefs.season)[0], fixed);
  if (!best) return null;
  return { title: fixed.length ? "COMPLETE YOUR LOOK" : `${(prefs.occasionLabel || prefs.occasion).toUpperCase()} LOOK`, ...best, explanation: explain(prefs, best), prefs: { ...prefs } };
}
