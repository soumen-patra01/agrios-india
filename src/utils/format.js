/* Formatting helpers. Indian conventions throughout. */

export const rupee = (n) =>
  "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(n || 0));

export const compact = (n) => {
  if (n >= 1e7) return "₹" + (n / 1e7).toFixed(1).replace(/\.0$/, "") + " Cr";
  if (n >= 1e5) return "₹" + (n / 1e5).toFixed(1).replace(/\.0$/, "") + " L";
  if (n >= 1e3) return "₹" + (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return rupee(n);
};

export const greetingKey = () => {
  const h = new Date().getHours();
  return h < 12 ? "gm" : h < 17 ? "ga" : "ge";
};

export const longDate = (locale = "en-IN") =>
  new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });

export const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || "").join("") || "F";
