import { HERO_IMAGE } from "../utils/imageResolver.js";

export { HERO_IMAGE };

export const OCCASIONS = [
  { name: "College", emoji: "🎓" }, { name: "Interview", emoji: "💼" }, { name: "Wedding", emoji: "💍" }, { name: "Party", emoji: "🎉" },
  { name: "Date", emoji: "❤️" }, { name: "Gym", emoji: "🏋️" }, { name: "Travel", emoji: "✈️" }, { name: "Office", emoji: "🏢" },
];
export const ALL_OCCASIONS = ["College", "Interview", "Office", "Casual", "Party", "Date", "Wedding", "Festival", "Travel", "Gym", "Formal Event"];
export const STYLES = ["Casual", "Formal", "Smart Casual", "Streetwear", "Traditional", "Minimal", "Sporty", "Elegant", "Trendy", "Party"];
export const BUDGETS = [1000, 2000, 3000, 5000, 10000];
export const COLORS = ["Black", "White", "Blue", "Red", "Green", "Grey", "Beige", "Brown", "Pink", "Navy"];
export const SEASONS = ["Summer", "Winter", "Monsoon", "Spring"];
export const FITS = ["Slim", "Regular", "Relaxed", "Oversized"];

export const PRICE_RANGES = [
  { label: "Under ₹1,000", min: "", max: "1000" },
  { label: "₹1,000 – ₹2,000", min: "1000", max: "2000" },
  { label: "₹2,000 – ₹3,000", min: "2000", max: "3000" },
  { label: "₹3,000 – ₹5,000", min: "3000", max: "5000" },
  { label: "₹5,000 & above", min: "5000", max: "" },
];
export const SORTS = [
  { value: "popularity", label: "Popularity" }, { value: "newest", label: "Newest" }, { value: "rating", label: "Top rated" },
  { value: "price_asc", label: "Price: Low → High" }, { value: "price_desc", label: "Price: High → Low" },
];
