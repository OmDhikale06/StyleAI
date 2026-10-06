export const inr = (n) => "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");

export const COLOR_HEX = {
  Black: "#18181b", White: "#ffffff", Blue: "#2563eb", Red: "#dc2626", Green: "#16a34a", Grey: "#9ca3af",
  Beige: "#e7d8c0", Brown: "#7c4a2d", Pink: "#f472b6", Navy: "#1e2a5a", Maroon: "#7f1d1d",
};
export const colorHex = (c) => COLOR_HEX[c] || "#d4d4d8";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];
export const sortSizes = (arr) =>
  [...arr].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a), bi = SIZE_ORDER.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return String(a).localeCompare(String(b), undefined, { numeric: true });
  });

export const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
