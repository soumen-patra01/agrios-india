/* Marketplace taxonomies. Icons are names from the curated Icon registry. */

export const PRODUCT_CATEGORIES = [
  { id: "seeds",      label: "Seeds",           icon: "Sprout",       accent: "primary" },
  { id: "fertilizer", label: "Fertilizers",     icon: "Leaf",         accent: "primary" },
  { id: "pesticide",  label: "Crop Protection", icon: "SprayCan",     accent: "orange"  },
  { id: "bioinput",   label: "Bio Inputs",      icon: "FlaskConical", accent: "primary" },
  { id: "feed",       label: "Feed",            icon: "Package",      accent: "orange"  },
  { id: "medicine",   label: "Medicine",        icon: "Pill",         accent: "red"     },
  { id: "equipment",  label: "Equipment",       icon: "Tractor",      accent: "yellow"  },
  { id: "tools",      label: "Tools & Spares",  icon: "Wrench",       accent: "blue"    },
  { id: "organic",    label: "Organic Produce", icon: "Wheat",        accent: "primary" },
  { id: "livestock",  label: "Livestock",       icon: "Rabbit",       accent: "red"     },
];

export const UNITS = ["kg", "g", "L", "mL", "bag", "packet", "pcs", "set", "qtl", "animal"];

export const SELLER_TYPES = [
  { id: "farmer",       label: "Farmer" },
  { id: "fpo",          label: "FPO" },
  { id: "cooperative",  label: "Cooperative" },
  { id: "dealer",       label: "Input Dealer" },
  { id: "company",      label: "Company" },
  { id: "manufacturer", label: "Manufacturer" },
  { id: "distributor",  label: "Distributor" },
  { id: "retailer",     label: "Retailer" },
  { id: "wholesaler",   label: "Wholesaler" },
  { id: "govt",         label: "Government Org" },
];

/* Forward fulfilment flow. Cancel / return / refund sit outside the line. */
export const ORDER_FLOW = ["pending", "processing", "packed", "shipped", "delivered"];

export const ORDER_STATUS = {
  pending:         { label: "Pending",          a: "yellow"  },
  processing:      { label: "Processing",       a: "blue"    },
  packed:          { label: "Packed",           a: "blue"    },
  shipped:         { label: "Shipped",          a: "orange"  },
  delivered:       { label: "Delivered",        a: "primary" },
  cancelled:       { label: "Cancelled",        a: "red"     },
  returned:        { label: "Returned",         a: "red"     },
  refundRequested: { label: "Refund requested", a: "orange"  },
  refundApproved:  { label: "Refund approved",  a: "primary" },
};

/* Honest labels — no money moves in this phase; collection needs the backend. */
export const PAYMENT_METHODS = [
  { id: "cod",  label: "Cash on Delivery" },
  { id: "upi",  label: "UPI on Delivery" },
  { id: "bank", label: "Bank Transfer (settle directly)" },
];

export const PRODUCT_STATUS = {
  draft:     { label: "Draft",     a: "yellow"  },
  published: { label: "Live",      a: "primary" },
  archived:  { label: "Archived",  a: "red"     },
};

export const categoryMeta = (id) =>
  PRODUCT_CATEGORIES.find((c) => c.id === id) ||
  { id, label: id, icon: "Package", accent: "primary" };
