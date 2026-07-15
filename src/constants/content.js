/* Static demo content for Phase 1. All of this is placeholder UI data — no live
   sources. Icons are lucide-react names resolved by the screens. */

export const ENTERPRISES = [
  { id: "crop", label: "Crop", icon: "Wheat" },
  { id: "dairy", label: "Dairy", icon: "Milk" },
  { id: "poultry", label: "Poultry", icon: "Bird" },
  { id: "goat", label: "Goat", icon: "Rabbit" },
  { id: "pig", label: "Pig", icon: "PiggyBank" },
  { id: "fish", label: "Fish", icon: "Fish" },
  { id: "bee", label: "Bee keeping", icon: "Bug" },
  { id: "horti", label: "Horticulture", icon: "Sprout" },
];

export const ONBOARDING = [
  { icon: "Sprout", accent: "primary", title: "Your whole farm, one app",
    body: "Crops, dairy, poultry, fish and more — track every enterprise from a single, beautifully simple place." },
  { icon: "Bot", accent: "blue", title: "An AI team for your farm",
    body: "A doctor, an accountant, an advisor and more — intelligent help that understands Indian farming." },
  { icon: "TrendingUp", accent: "orange", title: "Grow it like a business",
    body: "Market prices, government schemes, accounts and services — the tools to earn more, all in your language." },
];

/* agentId links each card to an engine agent (src/ai/agents/registry.js). */
export const AI_TOOLS = [
  { id: "doctor", agentId: "farmDoctor", title: "AI Doctor", desc: "Diagnose crop & animal illness", icon: "Stethoscope", accent: "red" },
  { id: "advisor", agentId: "cropExpert", title: "AI Crop Advisor", desc: "Sowing to harvest, step by step", icon: "Sprout", accent: "primary" },
  { id: "livestock", agentId: "livestockExpert", title: "AI Livestock Expert", desc: "Poultry, goat, dairy, fish & more", icon: "Rabbit", accent: "orange" },
  { id: "vet", agentId: "veterinaryExpert", title: "AI Vet Advisor", desc: "Animal health, vaccines & first aid", icon: "ShieldCheck", accent: "red" },
  { id: "accountant", agentId: "financeExpert", title: "AI Finance Expert", desc: "Accounts, profit, tax & insurance", icon: "Calculator", accent: "blue" },
  { id: "loan", agentId: "loanAdvisor", title: "AI Loan Advisor", desc: "Eligibility, EMI & documents", icon: "Landmark", accent: "yellow" },
  { id: "schemes", agentId: "governmentAdvisor", title: "AI Scheme Advisor", desc: "Government schemes you qualify for", icon: "Building2", accent: "primary" },
  { id: "weather", agentId: "weatherExpert", title: "AI Weather", desc: "Spray windows & field-work timing", icon: "CloudSun", accent: "blue" },
  { id: "market", agentId: "marketExpert", title: "AI Market", desc: "Best time & mandi to sell", icon: "LineChart", accent: "orange" },
  { id: "business", agentId: "businessAdvisor", title: "AI Business Advisor", desc: "DPR, project reports & scaling", icon: "Briefcase", accent: "blue" },
  { id: "learn", agentId: "educationExpert", title: "AI Learning Guide", desc: "Learn new farming skills", icon: "GraduationCap", accent: "yellow" },
  { id: "chat", agentId: null, title: "AI Chat", desc: "Ask anything — auto-routes to the right expert", icon: "MessageCircle", accent: "primary" },
];

export const QUICK_ACTIONS = [
  { id: "doctor", title: "AI Doctor", icon: "Stethoscope", accent: "red" },
  { id: "advisor", title: "Advisor", icon: "Sprout", accent: "primary" },
  { id: "market", title: "Sell", icon: "LineChart", accent: "orange" },
  { id: "chat", title: "Ask AI", icon: "MessageCircle", accent: "blue" },
];

export const TASKS = [
  { id: 1, text: "Irrigate the north paddy plot", tag: "Crop", done: false },
  { id: 2, text: "Vaccinate new poultry batch", tag: "Poultry", done: false },
  { id: 3, text: "Record yesterday's milk sale", tag: "Dairy", done: true },
];

export const SCHEMES = [
  { id: 1, title: "PM-KISAN", tag: "Income support", note: "₹6,000/year direct benefit", accent: "primary" },
  { id: 2, title: "Kisan Credit Card", tag: "Credit", note: "Low-interest crop loans", accent: "blue" },
  { id: 3, title: "PMFBY", tag: "Insurance", note: "Crop insurance cover", accent: "orange" },
];

export const PRICES = [
  { id: 1, crop: "Paddy", mandi: "Barasat", price: 2203, unit: "qtl", up: true, change: 1.8 },
  { id: 2, crop: "Potato", mandi: "Hooghly", price: 1450, unit: "qtl", up: false, change: 2.4 },
  { id: 3, crop: "Mustard", mandi: "Nadia", price: 5600, unit: "qtl", up: true, change: 0.9 },
  { id: 4, crop: "Milk", mandi: "Local", price: 42, unit: "L", up: true, change: 0.5 },
];

export const NEWS = [
  { id: 1, tag: "Weather", title: "Light rain expected across Gangetic West Bengal this week", time: "2h ago" },
  { id: 2, tag: "Policy", title: "New MSP rates announced for kharif crops", time: "1d ago" },
  { id: 3, tag: "Advisory", title: "Watch for stem borer in transplanted paddy", time: "2d ago" },
];

export const CALCULATORS = [
  { id: "emi", title: "Loan EMI", icon: "Landmark", accent: "blue" },
  { id: "profit", title: "Profit", icon: "TrendingUp", accent: "primary" },
  { id: "feed", title: "Feed cost", icon: "Package", accent: "orange" },
  { id: "seed", title: "Seed rate", icon: "Sprout", accent: "yellow" },
  { id: "fert", title: "Fertilizer", icon: "Leaf", accent: "primary" },
  { id: "yield", title: "Yield", icon: "BarChart3", accent: "red" },
];

export const CATEGORIES = [
  { id: "crop", title: "Crops", icon: "Wheat", accent: "primary" },
  { id: "dairy", title: "Dairy", icon: "Milk", accent: "blue" },
  { id: "poultry", title: "Poultry", icon: "Bird", accent: "orange" },
  { id: "goat", title: "Goat", icon: "Rabbit", accent: "yellow" },
  { id: "fish", title: "Fish", icon: "Fish", accent: "blue" },
  { id: "horti", title: "Horticulture", icon: "Sprout", accent: "primary" },
];

export const FEATURED = [
  { id: "vet", title: "Veterinary at home", desc: "Book a vet visit", icon: "Stethoscope", accent: "red" },
  { id: "soil", title: "Soil testing", desc: "Know your soil health", icon: "FlaskConical", accent: "orange" },
  { id: "drone", title: "Drone spraying", desc: "Fast, even coverage", icon: "Send", accent: "blue" },
];

export const MARKET_SECTIONS = [
  { id: "prices", title: "Today's prices", icon: "LineChart", accent: "primary" },
  { id: "buyers", title: "Nearby buyers", icon: "Users", accent: "blue" },
  { id: "sellers", title: "Nearby sellers", icon: "Store", accent: "orange" },
  { id: "marketplace", title: "Marketplace", icon: "ShoppingBag", accent: "primary" },
  { id: "equipment", title: "Equipment", icon: "Tractor", accent: "yellow" },
  { id: "seeds", title: "Seeds", icon: "Sprout", accent: "primary" },
  { id: "feed", title: "Feed", icon: "Package", accent: "orange" },
  { id: "medicine", title: "Medicine", icon: "Pill", accent: "red" },
];

export const SERVICES = [
  { id: "marketplace", title: "Marketplace",      desc: "Buy & sell seeds, feed, equipment",   icon: "ShoppingBag", accent: "primary", kind: "marketplace" },
  { id: "svcMp",    title: "Service Marketplace", desc: "Book vet, drone, machinery & more",  icon: "Handshake", accent: "blue",    kind: "svcMarketplace" },
  { id: "erp",       title: "Farm ERP",           desc: "Complete farm management system",     icon: "Tractor",   accent: "primary", kind: "farmErp" },
  { id: "livestock", title: "Livestock Manager", desc: "Poultry, dairy, goat, pig, sheep, fish & bees", icon: "Rabbit", accent: "primary", kind: "livestockHub" },
  { id: "vax",       title: "Vaccination Calendar", desc: "Upcoming & missed vaccinations",   icon: "Syringe",   accent: "red",     kind: "vaccinationCalendar" },
  { id: "inventory", title: "Inventory",           desc: "Feed, medicine & stock alerts",     icon: "Warehouse", accent: "orange",  kind: "erpInventory" },
  { id: "tasks",     title: "Task Manager",        desc: "Daily work & reminders",            icon: "ListChecks", accent: "blue",   kind: "erpTasks" },
  { id: "business",  title: "Farm Business",     desc: "P&L, cash flow & profit analysis",  icon: "BarChart3", accent: "blue", kind: "businessDashboard" },
  { id: "ledger",    title: "Farm Ledger",        desc: "Income & expense tracking",          icon: "BookOpen",  accent: "primary", kind: "farmLedger" },
  { id: "calendar",  title: "Crop Calendar",      desc: "Season tasks & reminders",           icon: "CalendarDays", accent: "primary", kind: "cropCalendar" },
  { id: "vet", title: "Veterinary", desc: "Doctors & clinics near you", icon: "Stethoscope", accent: "red", kind: "svcMarketplace", props: { category: "vet" } },
  { id: "soil", title: "Soil testing", desc: "Labs & at-home kits", icon: "FlaskConical", accent: "orange", kind: "svcMarketplace", props: { category: "soilTest" } },
  { id: "drone", title: "Drone services", desc: "Spraying & mapping", icon: "Send", accent: "blue", kind: "svcMarketplace", props: { category: "drone" } },
  { id: "govt", title: "Government office", desc: "Find your local office", icon: "Landmark", accent: "primary" },
  { id: "training", title: "Training center", desc: "KVK & skill programs", icon: "GraduationCap", accent: "yellow", kind: "svcMarketplace", props: { category: "training" } },
  { id: "bank", title: "Bank", desc: "Loans & accounts", icon: "Building2", accent: "blue" },
  { id: "insurance", title: "Insurance", desc: "Crop & livestock cover", icon: "ShieldCheck", accent: "primary", kind: "svcMarketplace", props: { category: "insurance" } },
  { id: "labor", title: "Labor", desc: "Hire farm workers", icon: "Users", accent: "orange", kind: "svcMarketplace", props: { category: "farmWorker" } },
  { id: "transport", title: "Transport", desc: "Move produce to market", icon: "Truck", accent: "yellow", kind: "svcMarketplace", props: { category: "transport" } },
];

export const PROFILE_ITEMS = [
  { id: "farm", title: "farmDetails", icon: "Wheat" },
  { id: "language", title: "language", icon: "Languages" },
  { id: "subscription", title: "subscription", icon: "Crown" },
  { id: "payments", title: "payments", icon: "CreditCard" },
  { id: "documents", title: "documents", icon: "FileText" },
  { id: "support", title: "support", icon: "LifeBuoy" },
  { id: "settings", title: "settings", icon: "Settings" },
  { id: "privacy", title: "privacy", icon: "Lock" },
];
