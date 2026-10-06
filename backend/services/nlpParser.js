// Rule-based entity extraction. No external AI API needed.
export const OCCASIONS = ["College","Interview","Office","Casual","Party","Date","Wedding","Festival","Travel","Gym","Formal Event"];
export const STYLES = ["Casual","Formal","Smart Casual","Streetwear","Traditional","Minimal","Sporty","Elegant","Trendy","Party"];
export const COLORS = ["Black","White","Blue","Red","Green","Grey","Beige","Brown","Pink","Navy"];
export const SEASONS = ["Summer","Winter","Monsoon","Spring"];
export const FITS = ["Slim","Regular","Relaxed","Oversized"];

const OCC_KEYWORDS = {
  Interview: ["interview","placement","campus recruitment","hr round","job fair","viva"],
  College: ["college","campus","presentation","class","lecture","university","seminar","semester","school"],
  Office: ["office","work","meeting","client","corporate","workplace","9 to 5","9-5","internship"],
  Party: ["party","club","clubbing","night out","birthday","bash","nightclub","get-together","get together"],
  Date: ["date","dinner","anniversary","romantic","girlfriend","boyfriend"],
  Wedding: ["wedding","shaadi","marriage","engagement","reception","sangeet","mehendi","haldi","baraat"],
  Festival: ["festival","diwali","eid","puja","navratri","holi","raksha","onam","pongal","durga","garba"],
  Travel: ["travel","trip","vacation","flight","holiday","airport","road trip","trekking","tour"],
  Gym: ["gym","workout","running","training","yoga","exercise","jog","sports"],
  "Formal Event": ["formal event","conference","gala","ceremony","farewell","award","convocation","formal dinner","formal function"],
  Casual: ["casual","hangout","hang out","everyday","weekend","brunch","outing","friends","movie","mall","daily wear"],
};

const STYLE_KEYWORDS = {
  "Smart Casual": ["smart casual","smart-casual","business casual"],
  Formal: ["formal","professional","sharp","business"],
  Streetwear: ["streetwear","street style","street","urban","hype"],
  Traditional: ["traditional","ethnic","desi","indian wear"],
  Minimal: ["minimal","minimalist","simple","clean look","understated"],
  Sporty: ["sporty","athletic","athleisure"],
  Elegant: ["elegant","classy","graceful","sophisticated","chic"],
  Trendy: ["trendy","fashionable","stylish","latest","on trend"],
  Party: ["party style","partywear","glam","flashy"],
  Casual: ["relaxed","laid back","laid-back"],
};

const DEFAULT_STYLES = {
  Interview: ["Formal"], College: ["Smart Casual","Formal"], Office: ["Formal","Smart Casual"],
  Party: ["Party","Trendy"], Date: ["Smart Casual","Elegant"], Wedding: ["Traditional"],
  Festival: ["Traditional"], Travel: ["Casual"], Gym: ["Sporty"], "Formal Event": ["Formal","Elegant"], Casual: ["Casual"],
};
export const defaultStylesFor = (occ) => DEFAULT_STYLES[occ] || ["Casual"];

const has = (text, kw) => new RegExp(`(^|[^a-z])${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}([^a-z]|$)`).test(text);

export function parseBudget(raw) {
  const s = raw.toLowerCase().replace(/,/g, "");
  const tries = [
    /(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)\s*(k)?(\+)?/,
    /(?:under|below|within|upto|up to|budget(?:\s+of|\s+is)?|max(?:imum)?|around|about|less than)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(k)?(\+)?/,
    /\b(\d+(?:\.\d+)?)\s*(k)\b/,
    /\b(\d{3,6})\s*(?:rupees|rs|inr|bucks)\b/,
    /\b(\d{4,6})(\+)?\b/,
  ];
  for (const re of tries) {
    const m = s.match(re);
    if (!m) continue;
    const val = Math.round(parseFloat(m[1]) * (m[2] === "k" ? 1000 : 1));
    if (val >= 300 && val <= 200000) return val;
  }
  return null;
}

export function parseQuery(raw = "") {
  const text = ` ${String(raw).toLowerCase()} `;
  const detected = {};

  // Gender
  let gender = null;
  const men = ["men","man","male","boy","guy","gentleman","he","him","his","husband","brother","boyfriend"].filter((k) => has(text, k)).length;
  const women = ["women","woman","female","girl","lady","ladies","she","her","hers","wife","sister","girlfriend"].filter((k) => has(text, k)).length;
  if (men > women) gender = "Men"; else if (women > men) gender = "Women";
  if (gender) detected.gender = gender;

  // Occasion: most keyword hits wins, ties go to the earliest mention
  let occasion = null, best = 0, bestPos = Infinity;
  for (const [occ, kws] of Object.entries(OCC_KEYWORDS)) {
    let hits = 0, pos = Infinity;
    for (const k of kws) if (has(text, k)) { hits++; pos = Math.min(pos, text.indexOf(k)); }
    if (hits > best || (hits === best && hits > 0 && pos < bestPos)) { best = hits; occasion = occ; bestPos = pos; }
  }
  let occasionLabel = occasion;
  if (occasion === "College" && has(text, "presentation")) occasionLabel = "College Presentation";
  if (occasion) detected.occasion = occasionLabel;

  // Styles (explicit mentions first, then defaults for the occasion)
  const styles = [];
  for (const [st, kws] of Object.entries(STYLE_KEYWORDS)) if (kws.some((k) => has(text, k)) && !styles.includes(st)) styles.push(st);
  if (styles.length) detected.style = styles.join(" / ");
  else if (occasion) detected.style = defaultStylesFor(occasion).join(" / ") + " (inferred)";

  const budget = parseBudget(raw);
  if (budget) detected.budget = budget;

  const color = COLORS.find((c) => has(text, c.toLowerCase())) || (has(text, "maroon") ? "Red" : has(text, "navy blue") ? "Navy" : null);
  if (color) detected.color = color;

  let season = null;
  if (["summer","hot","sunny","humid"].some((k) => has(text, k))) season = "Summer";
  else if (["winter","cold","chilly","snow"].some((k) => has(text, k))) season = "Winter";
  else if (["monsoon","rain","rainy"].some((k) => has(text, k))) season = "Monsoon";
  else if (has(text, "spring")) season = "Spring";
  if (season) detected.season = season;

  let fit = null;
  if (["oversized","baggy","boxy"].some((k) => has(text, k))) fit = "Oversized";
  else if (["slim","fitted","tailored"].some((k) => has(text, k))) fit = "Slim";
  else if (["relaxed","loose","comfortable fit"].some((k) => has(text, k))) fit = "Relaxed";
  else if (has(text, "regular fit")) fit = "Regular";
  if (fit) detected.fit = fit;

  return { gender, occasion, occasionLabel, styles, budget, color, season, fit, detected };
}
