import {
  Wheat, Milk, Egg, Beef, Carrot, Landmark, Banknote,
  Sprout, Leaf, Bug, Droplets, Users, Package, Syringe,
  Fuel, Truck, Zap, Home as HomeIcon, CreditCard, MoreHorizontal,
  LayoutGrid, Fish, Bird, Rabbit, SprayCan, Scissors,
} from "lucide-react";

/* Domain metadata carries an i18n key instead of a fixed label. */
export const ENTERPRISES = {
  paddy: { key: "entPaddy", icon: Wheat }, wheat: { key: "entWheat", icon: Wheat },
  veg: { key: "entVeg", icon: Carrot }, dairy: { key: "entDairy", icon: Milk },
  poultry: { key: "entPoultry", icon: Bird }, goat: { key: "entGoat", icon: Rabbit },
  fish: { key: "entFish", icon: Fish },
};

export const CATS = {
  income: {
    crop: { key: "cCrop", icon: Wheat }, milk: { key: "cMilk", icon: Milk },
    egg: { key: "cEgg", icon: Egg }, livestock: { key: "cLivestock", icon: Beef },
    produce: { key: "cProduce", icon: Carrot }, subsidy: { key: "cSubsidy", icon: Landmark },
    other_in: { key: "cOtherIn", icon: Banknote },
  },
  expense: {
    seeds: { key: "cSeeds", icon: Sprout }, fertilizer: { key: "cFertilizer", icon: Leaf },
    pesticide: { key: "cPesticide", icon: Bug }, irrigation: { key: "cIrrigation", icon: Droplets },
    labour: { key: "cLabour", icon: Users }, feed: { key: "cFeed", icon: Package },
    vet: { key: "cVet", icon: Syringe }, machinery: { key: "cMachinery", icon: Fuel },
    transport: { key: "cTransport", icon: Truck }, electricity: { key: "cElectricity", icon: Zap },
    rent: { key: "cRent", icon: HomeIcon }, emi: { key: "cEmi", icon: CreditCard },
    other_ex: { key: "cOtherEx", icon: MoreHorizontal },
  },
};

export const ACTIVITIES = {
  sowing: { key: "actSowing", icon: Sprout }, irrigation: { key: "actIrrigation", icon: Droplets },
  fertilizer: { key: "actFertilizer", icon: Leaf }, spraying: { key: "actSpraying", icon: SprayCan },
  weeding: { key: "actWeeding", icon: Scissors }, harvest: { key: "actHarvest", icon: Wheat },
  feeding: { key: "actFeeding", icon: Package }, vaccination: { key: "actVaccination", icon: Syringe },
  sale: { key: "actSale", icon: Banknote }, other: { key: "actOther", icon: MoreHorizontal },
};

/* State names are proper nouns — kept in English/Latin script.
   Coordinates (state capital or centroid) feed the weather forecast. */
export const STATES = {
  "West Bengal": { lat: 22.57, lon: 88.36 },
  "Bihar": { lat: 25.59, lon: 85.14 },
  "Odisha": { lat: 20.27, lon: 85.84 },
  "Uttar Pradesh": { lat: 26.85, lon: 80.95 },
  "Punjab": { lat: 30.73, lon: 76.78 },
  "Maharashtra": { lat: 19.08, lon: 72.88 },
  "Karnataka": { lat: 12.97, lon: 77.59 },
  "Tamil Nadu": { lat: 13.08, lon: 80.27 },
  "Other": { lat: 21.15, lon: 79.09 },
};

export const catMeta = (t, k) => (CATS[t] && CATS[t][k]) || { key: "cOtherEx", icon: MoreHorizontal };
export const entMeta = (k) => ENTERPRISES[k] || { key: "entPaddy", icon: LayoutGrid };
export const actMeta = (k) => ACTIVITIES[k] || { key: "actOther", icon: MoreHorizontal };

/* Indian digit grouping: ₹1,08,600 */
export const fmt = (n) => "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(n || 0));

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const prettyDate = (iso, locale) =>
  new Date(iso + "T00:00:00").toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });

export const longToday = (locale) =>
  new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });

export const K = {
  profile: "agrios_profile", tx: "agrios_transactions", tasks: "agrios_tasks",
  diary: "agrios_diary", settings: "agrios_settings", weather: "agrios_weather",
};

export async function loadKey(key, fallback) {
  try {
    if (!window.storage) return fallback;
    const r = await window.storage.get(key);
    return r && r.value ? JSON.parse(r.value) : fallback;
  } catch (e) { return fallback; }
}
export async function saveKey(key, val) {
  try { if (window.storage) await window.storage.set(key, JSON.stringify(val)); } catch (e) {}
}

export function sampleTx() {
  const m = todayISO().slice(0, 7);
  const d = (n) => `${m}-${String(n).padStart(2, "0")}`;
  const mk = (type, category, amount, note, farm, day) =>
    ({ id: "s" + Math.random().toString(36).slice(2), type, category, amount, note, farm, date: d(day) });
  return [
    mk("income", "crop", 84000, "Paddy — 40 quintal", "paddy", 22),
    mk("income", "milk", 18600, "Dairy collection", "dairy", 20),
    mk("income", "subsidy", 6000, "PM-KISAN instalment", "paddy", 12),
    mk("expense", "labour", 14500, "Harvest wages", "paddy", 21),
    mk("expense", "fertilizer", 9200, "Urea + DAP", "paddy", 8),
    mk("expense", "feed", 7400, "Cattle feed", "dairy", 5),
    mk("expense", "irrigation", 3100, "Diesel pump", "paddy", 15),
    mk("expense", "vet", 1800, "Deworming", "dairy", 9),
  ];
}
