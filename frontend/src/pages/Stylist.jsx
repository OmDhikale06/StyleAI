import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import OutfitView from "../components/OutfitView.jsx";
import { SparkIcon } from "../components/Icons.jsx";
import { ALL_OCCASIONS, BUDGETS, COLORS, FITS, SEASONS, STYLES } from "../data/constants.js";
import { colorHex, inr } from "../utils/format.js";

const STEPS = ["Reading your occasion and style…", "Scoring every product in the catalogue…", "Matching colours and checking your budget…", "Putting your look together…"];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const budgetLabel = (b) => (b >= 10000 ? "₹10,000+" : inr(b));
const EXAMPLES = ["I have an interview tomorrow and my budget is ₹3000", "College presentation tomorrow under ₹3000", "Wedding next week, budget ₹10000"];

export default function Stylist() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const initialOcc = ALL_OCCASIONS.includes(sp.get("occasion")) ? sp.get("occasion") : "";
  const [form, setForm] = useState({ query: "", gender: "", occasion: initialOcc, style: "", budget: "", color: "", season: "", fit: "" });
  const [state, setState] = useState({ status: "idle" });
  const [step, setStep] = useState(0);
  const resultRef = useRef(null);

  useEffect(() => { if (initialOcc) setForm((f) => ({ ...f, occasion: initialOcc })); }, [initialOcc]);
  useEffect(() => {
    if (state.status !== "loading") return;
    const t = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 700);
    return () => clearInterval(t);
  }, [state.status]);
  useEffect(() => { if (state.status === "done") resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [state.status]);

  const pick = (k, v) => setForm((f) => ({ ...f, [k]: f[k] === v ? "" : v }));

  const submit = async (e) => {
    e?.preventDefault();
    const body = {};
    if (form.query.trim()) body.query = form.query.trim();
    for (const k of ["gender", "occasion", "style", "budget", "color", "season", "fit"]) if (form[k]) body[k] = form[k];
    if (!body.query && !(body.gender && body.occasion)) {
      return setState({ status: "error", message: "Tell us where you're going and who you're dressing — or just type it in the box above." });
    }
    setStep(0); setState({ status: "loading" });
    const t0 = Date.now();
    try {
      const d = await api("/api/ai/stylist", { method: "POST", body });
      await wait(Math.max(0, 1500 - (Date.now() - t0)));
      if (d.needs) setState({ status: "needs", message: d.message, parsed: d.parsed });
      else setState({ status: "done", outfit: d.outfit, parsed: d.parsed });
    } catch (err) { setState({ status: "error", message: err.message }); }
  };

  const Chips = ({ k, items, render }) => (
    <div className="chips">{items.map((v) => (
      <button type="button" key={v} className={`chip lg ${form[k] === v ? "on" : ""}`} onClick={() => pick(k, v)} aria-pressed={form[k] === v}>{render ? render(v) : v}</button>
    ))}</div>
  );

  const parsedEntries = state.parsed ? Object.entries(state.parsed) : [];
  const pretty = { gender: "For", occasion: "Occasion", style: "Style", budget: "Budget", color: "Colour", season: "Season", fit: "Fit" };

  return (
    <div className="container stylist">
      <header className="stylist-head">
        <span className="eyebrow"><SparkIcon width={14} height={14} style={{ verticalAlign: "-2px" }} /> AI Personal Stylist</span>
        <h1>Meet Your AI Stylist</h1>
        <p className="muted">Tell us where you're going. We'll tell you what to wear.</p>
      </header>

      <form className="stylist-form" onSubmit={submit}>
        <label className="field nl">What should I wear?
          <textarea rows={2} value={form.query} onChange={(e) => setForm({ ...form, query: e.target.value })} maxLength={500}
            placeholder="e.g. I have a college presentation tomorrow under ₹3000" />
        </label>
        <div className="examples">{EXAMPLES.map((ex) => <button type="button" key={ex} className="example" onClick={() => setForm({ ...form, query: ex })}>{ex}</button>)}</div>

        <div className="or"><span>or choose your details</span></div>

        <div className="fblock"><h3>Gender</h3><Chips k="gender" items={["Men", "Women"]} /></div>
        <div className="fblock"><h3>Occasion</h3><Chips k="occasion" items={ALL_OCCASIONS} /></div>
        <div className="fblock"><h3>Style <span className="muted small">optional</span></h3><Chips k="style" items={STYLES} /></div>
        <div className="fblock"><h3>Budget <span className="muted small">optional</span></h3><Chips k="budget" items={BUDGETS.map(String)} render={(v) => budgetLabel(Number(v))} /></div>
        <div className="fblock"><h3>Preferred color <span className="muted small">optional</span></h3>
          <div className="swatches lg">{COLORS.map((c) => (
            <button type="button" key={c} className={`swatch ${form.color === c ? "on" : ""}`} style={{ background: colorHex(c) }} title={c} aria-label={c} aria-pressed={form.color === c} onClick={() => pick("color", c)} />
          ))}</div>
        </div>
        <div className="fblock two">
          <div><h3>Season <span className="muted small">optional</span></h3><Chips k="season" items={SEASONS} /></div>
          <div><h3>Fit preference <span className="muted small">optional</span></h3><Chips k="fit" items={FITS} /></div>
        </div>

        <button className="btn btn-primary btn-lg btn-block" disabled={state.status === "loading"}>
          <SparkIcon width={18} height={18} /> {state.status === "loading" ? "Styling you…" : "Generate my look"}
        </button>
      </form>

      <div ref={resultRef} className="stylist-result">
        {state.status === "loading" && (
          <div className="ai-loading" role="status">
            <div className="ai-orb"><i /><i /><i /></div>
            <p key={step} className="ai-step">{STEPS[step]}</p>
          </div>
        )}
        {state.status === "error" && <p className="form-error big" role="alert">{state.message}</p>}
        {state.status === "needs" && (
          <div className="needs" role="alert">
            <h3>One more thing</h3><p>{state.message}</p>
            {parsedEntries.length > 0 && <p className="muted small">So far we understood: {parsedEntries.map(([k, v]) => `${pretty[k]}: ${k === "budget" ? budgetLabel(v) : v}`).join(" · ")}</p>}
          </div>
        )}
        {state.status === "done" && (
          <>
            <div className="result-head">
              <span className="eyebrow">Your AI recommended look</span>
              <h2>🎯 {state.outfit.title}</h2>
              {parsedEntries.length > 0 && (
                <div className="understood"><span className="muted small">We understood:</span>
                  {parsedEntries.map(([k, v]) => <span key={k} className="tag">{pretty[k]}: {k === "budget" ? budgetLabel(v) : v}</span>)}
                </div>
              )}
            </div>
            <OutfitView outfit={state.outfit} onAdded={() => navigate("/cart")} />
            <div className="why-box"><h3>Why this look?</h3><p>{state.outfit.explanation}</p></div>
          </>
        )}
      </div>
    </div>
  );
}
