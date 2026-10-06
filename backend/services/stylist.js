// Orchestration for the AI endpoints. Pure: takes products + request body, returns a result object.
import { parseQuery, parseBudget, OCCASIONS, STYLES, COLORS, SEASONS, FITS } from "./nlpParser.js";
import { buildOutfit } from "./recommender.js";

const pick = (v, list) => list.find((x) => x.toLowerCase() === String(v ?? "").trim().toLowerCase()) || null;

export function normalizePrefs(body = {}) {
  const errors = [];
  const out = {};
  const raw = (k) => (body[k] === undefined || body[k] === null || String(body[k]).trim() === "" ? null : body[k]);

  if (raw("gender")) {
    const g = String(body.gender).trim().toLowerCase();
    out.gender = ["men", "male", "man"].includes(g) ? "Men" : ["women", "female", "woman"].includes(g) ? "Women" : null;
    if (!out.gender) errors.push("gender must be Men or Women");
  }
  if (raw("occasion")) { out.occasion = pick(body.occasion, OCCASIONS); if (!out.occasion) errors.push(`occasion must be one of: ${OCCASIONS.join(", ")}`); }
  if (raw("style")) { out.style = pick(body.style, STYLES); if (!out.style) errors.push(`style must be one of: ${STYLES.join(", ")}`); }
  if (raw("budget")) {
    const n = typeof body.budget === "number" ? body.budget : parseBudget(`₹${String(body.budget).replace(/[^\d.k]/gi, "")}`);
    if (!Number.isFinite(n) || n < 300 || n > 200000) errors.push("budget must be between ₹300 and ₹2,00,000");
    else out.budget = Math.round(n);
  }
  if (raw("color")) { out.color = pick(body.color, COLORS); if (!out.color) errors.push(`color must be one of: ${COLORS.join(", ")}`); }
  if (raw("season")) { out.season = pick(body.season, SEASONS); if (!out.season) errors.push(`season must be one of: ${SEASONS.join(", ")}`); }
  if (raw("fit")) { out.fit = pick(body.fit, FITS); if (!out.fit) errors.push(`fit must be one of: ${FITS.join(", ")}`); }
  return { prefs: out, errors };
}

const toInput = (m) => ({
  gender: m.gender, occasion: m.occasion, occasionLabel: m.occasionLabel || m.occasion,
  styles: m.styles || [], budget: m.budget || null, color: m.color || null, season: m.season || null, fit: m.fit || null,
});

export function runRecommendation(products, body) {
  const { prefs, errors } = normalizePrefs(body);
  if (errors.length) return { status: 400, error: errors.join("; ") };
  if (!prefs.gender || !prefs.occasion) return { status: 400, error: "gender and occasion are required" };
  const outfit = buildOutfit(products, toInput({ ...prefs, styles: prefs.style ? [prefs.style] : [] }));
  if (!outfit) return { status: 404, error: "We could not build an outfit for these preferences yet." };
  return { status: 200, outfit };
}

export function runStylist(products, body) {
  const parsed = body.query ? parseQuery(String(body.query).slice(0, 500)) : { detected: {}, styles: [] };
  const { prefs: form, errors } = normalizePrefs(body);
  if (errors.length) return { status: 400, error: errors.join("; ") };

  const merged = {
    gender: form.gender || parsed.gender || null,
    occasion: form.occasion || parsed.occasion || null,
    occasionLabel: form.occasion ? form.occasion : parsed.occasionLabel || parsed.occasion || null,
    styles: form.style ? [form.style] : parsed.styles || [],
    budget: form.budget || parsed.budget || null,
    color: form.color || parsed.color || null,
    season: form.season || parsed.season || null,
    fit: form.fit || parsed.fit || null,
  };
  const missing = ["gender", "occasion"].filter((k) => !merged[k]);
  if (missing.length) {
    return { status: 200, needs: missing, parsed: parsed.detected, message: `Tell us ${missing.includes("occasion") ? "where you're going" : ""}${missing.length === 2 ? " and " : ""}${missing.includes("gender") ? "whether you want men's or women's styles" : ""}.` };
  }
  const outfit = buildOutfit(products, toInput(merged));
  if (!outfit) return { status: 404, error: "We could not build an outfit for these preferences yet." };
  return { status: 200, parsed: parsed.detected, outfit };
}

export function runCompleteLook(products, body) {
  const id = Number(body.productId);
  const anchor = products.find((p) => p.id === id);
  if (!Number.isInteger(id) || !anchor) return { status: 404, error: "Product not found" };
  const { prefs, errors } = normalizePrefs(body);
  if (errors.length) return { status: 400, error: errors.join("; ") };
  const anchorOcc = String(anchor.occasion).split(",")[0].trim();
  const input = toInput({
    gender: prefs.gender || (anchor.gender !== "Unisex" ? anchor.gender : "Unisex"),
    occasion: prefs.occasion || anchorOcc, styles: [anchor.style], budget: prefs.budget, color: prefs.color, season: prefs.season, fit: prefs.fit,
  });
  const outfit = buildOutfit(products, input, { fixed: [anchor] });
  if (!outfit) return { status: 404, error: "No matching items to complete this look." };
  const extras = outfit.items.filter((i) => !i.fixed);
  outfit.explanation = `These pieces complete your ${anchor.name.toLowerCase()}: ${extras.map((i) => i.label.toLowerCase()).join(", ")} chosen for matching ${anchor.style.toLowerCase()} style, ${anchorOcc.toLowerCase()} suitability and colors that pair well with ${anchor.primary_color.toLowerCase()}.`;
  return { status: 200, anchor: { id: anchor.id, name: anchor.name }, outfit };
}
