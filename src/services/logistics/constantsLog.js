/* Logistics & Smart Commerce taxonomies. */

export const PROVIDER_TYPES = [
  { id: "individual",  label: "Owner-Operator" },
  { id: "fleet",       label: "Fleet Company" },
  { id: "cooperative", label: "Transport Co-op" },
  { id: "fpo",         label: "FPO Logistics" },
  { id: "logistics",   label: "3PL / Logistics Co." },
];

export const VEHICLE_CATEGORIES = [
  { id: "truck",       label: "Truck",            icon: "Truck",      accent: "primary", capacityKg: 10000 },
  { id: "miniTruck",   label: "Mini Truck",       icon: "Truck",      accent: "blue",    capacityKg: 3000  },
  { id: "pickupVan",   label: "Pickup Van",       icon: "Truck",      accent: "blue",    capacityKg: 1500  },
  { id: "tractor",     label: "Tractor-Trolley",  icon: "Tractor",    accent: "yellow",  capacityKg: 5000  },
  { id: "threeWheeler",label: "Three-Wheeler",    icon: "Truck",      accent: "orange",  capacityKg: 500   },
  { id: "coldChain",   label: "Cold-Chain Vehicle",icon: "Snowflake", accent: "blue",    capacityKg: 8000  },
  { id: "container",   label: "Container",        icon: "Container",  accent: "primary", capacityKg: 25000 },
  { id: "railReady",   label: "Rail-Ready Wagon", icon: "Container",  accent: "primary", capacityKg: 60000 },
];

export const vehicleMeta = (id) =>
  VEHICLE_CATEGORIES.find((v) => v.id === id) ||
  { id, label: id, icon: "Truck", accent: "primary", capacityKg: 0 };

/* Shipment lifecycle — forward flow + terminal branches. */
export const SHIPMENT_FLOW = ["pending", "assigned", "picked_up", "in_transit", "delivered"];

export const SHIPMENT_STATUS = {
  pending:    { label: "Pending",     a: "yellow"  },
  assigned:   { label: "Assigned",    a: "blue"    },
  picked_up:  { label: "Picked Up",   a: "blue"    },
  in_transit: { label: "In Transit",  a: "orange"  },
  delivered:  { label: "Delivered",   a: "primary" },
  returned:   { label: "Returned",    a: "red"     },
  cancelled:  { label: "Cancelled",   a: "red"     },
};

export const DRIVER_STATUS = {
  available:  { label: "Available",   a: "primary" },
  on_trip:    { label: "On Trip",     a: "orange"  },
  off_duty:   { label: "Off Duty",    a: "yellow"  },
};

export const WAREHOUSE_TYPES = [
  { id: "dry",        label: "Dry Warehouse",   icon: "Warehouse", accent: "orange", cold: false },
  { id: "cold",       label: "Cold Storage",    icon: "Snowflake", accent: "blue",   cold: true  },
  { id: "controlled", label: "Controlled Atmosphere", icon: "Thermometer", accent: "blue", cold: true },
  { id: "silo",       label: "Grain Silo",      icon: "Boxes",     accent: "yellow", cold: false },
  { id: "packhouse",  label: "Pack House",      icon: "Package",   accent: "primary",cold: false },
];

export const warehouseMeta = (id) =>
  WAREHOUSE_TYPES.find((w) => w.id === id) ||
  { id, label: id, icon: "Warehouse", accent: "orange", cold: false };

export const STORAGE_BOOKING_STATUS = {
  requested: { label: "Requested", a: "yellow"  },
  active:    { label: "Active",    a: "primary" },
  completed: { label: "Completed", a: "blue"    },
  cancelled: { label: "Cancelled", a: "red"     },
};

export const CONTRACT_STATUS = {
  draft:     { label: "Draft",     a: "yellow"  },
  offered:   { label: "Offered",   a: "blue"    },
  active:    { label: "Active",    a: "primary" },
  completed: { label: "Completed", a: "blue"    },
  disputed:  { label: "Disputed",  a: "red"     },
  cancelled: { label: "Cancelled", a: "red"     },
};

export const AUCTION_TYPES = [
  { id: "forward", label: "Forward (sell to highest)" },
  { id: "reverse", label: "Reverse (buy at lowest)" },
];

export const AUCTION_STATUS = {
  scheduled: { label: "Scheduled", a: "yellow"  },
  live:      { label: "Live",      a: "primary" },
  closed:    { label: "Closed",    a: "blue"    },
  awarded:   { label: "Awarded",   a: "primary" },
  cancelled: { label: "Cancelled", a: "red"     },
};

export const PROCUREMENT_TYPES = [
  { id: "government",  label: "Government Procurement", icon: "Landmark" },
  { id: "fpo",         label: "FPO Procurement",        icon: "Users" },
  { id: "cooperative", label: "Cooperative Procurement",icon: "Users" },
  { id: "private",     label: "Private Procurement",    icon: "Building2" },
];

export const procurementMeta = (id) =>
  PROCUREMENT_TYPES.find((p) => p.id === id) ||
  { id, label: id, icon: "ClipboardList" };

export const PROCUREMENT_STATUS = {
  open:      { label: "Open",      a: "primary" },
  reviewing: { label: "Reviewing", a: "orange"  },
  awarded:   { label: "Awarded",   a: "blue"    },
  closed:    { label: "Closed",    a: "yellow"  },
};

export const EXPORT_STATUS = {
  preparing:  { label: "Preparing",  a: "yellow"  },
  documented: { label: "Documented", a: "blue"    },
  cleared:    { label: "Cleared",    a: "primary" },
  shipped:    { label: "Shipped",    a: "orange"  },
  delivered:  { label: "Delivered",  a: "primary" },
};

/* Export document checklist — status-only, no real customs integration. */
export const EXPORT_DOCS = [
  "Commercial Invoice",
  "Packing List",
  "Phytosanitary Certificate",
  "Certificate of Origin",
  "Bill of Lading",
  "APEDA Registration",
  "Quality / Residue Certificate",
];

/* Payment terms — bookkeeping labels only, no money movement. */
export const PAYMENT_TERMS = [
  { id: "onDelivery", label: "On Delivery" },
  { id: "advance",    label: "Advance" },
  { id: "milestone",  label: "Milestone" },
  { id: "escrow",     label: "Escrow (held till delivery)" },
  { id: "credit30",   label: "Net 30 Credit" },
];

export const COMMODITIES = [
  "Paddy", "Wheat", "Potato", "Onion", "Mustard", "Maize",
  "Tomato", "Jute", "Tea", "Pulses", "Banana", "Mango",
];

export const QUALITY_GRADES = ["A / FAQ", "B / Standard", "C / Fair", "Export Grade"];

/* Preset pickup/drop locations (lat/lon carried through for distance/ETA).
   A geocoded free-text picker is deferred to the backend phase. */
export const PLACES = [
  { id: "barasat",  name: "Barasat",             lat: 22.72, lon: 88.48 },
  { id: "kolkata",  name: "Kolkata Wholesale Mkt", lat: 22.57, lon: 88.36 },
  { id: "hooghly",  name: "Hooghly",             lat: 22.90, lon: 88.39 },
  { id: "burdwan",  name: "Burdwan",             lat: 23.24, lon: 87.86 },
  { id: "siliguri", name: "Siliguri",            lat: 26.72, lon: 88.39 },
  { id: "durgapur", name: "Durgapur",            lat: 23.55, lon: 87.29 },
  { id: "nadia",    name: "Nadia",               lat: 23.47, lon: 88.55 },
  { id: "haldia",   name: "Haldia Port",         lat: 22.06, lon: 88.06 },
];

export const placeById = (id) => PLACES.find((p) => p.id === id) || PLACES[0];

/* Simulated telemetry sensor kinds — link to iot/deviceRegistry protocols. */
export const SENSOR_KINDS = [
  { id: "gps",         label: "GPS Location", icon: "MapPin",      unit: "" },
  { id: "temperature", label: "Temperature",  icon: "Thermometer", unit: "°C" },
  { id: "humidity",    label: "Humidity",     icon: "Droplets",    unit: "%" },
];
