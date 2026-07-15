/* Service marketplace taxonomies. */

export const SERVICE_CATEGORIES = [
  { id: "vet",            label: "Veterinary",        icon: "Stethoscope",   accent: "red"     },
  { id: "agronomist",     label: "Agronomist",        icon: "Sprout",        accent: "primary" },
  { id: "plantDoctor",    label: "Plant Doctor",      icon: "Leaf",          accent: "primary" },
  { id: "drone",          label: "Drone Service",     icon: "Send",          accent: "blue"    },
  { id: "soilTest",       label: "Soil Testing",      icon: "FlaskConical",  accent: "orange"  },
  { id: "machineryRental",label: "Machinery Rental",  icon: "Tractor",       accent: "yellow"  },
  { id: "coldStorage",    label: "Cold Storage",      icon: "Snowflake",     accent: "blue"    },
  { id: "transport",      label: "Transport",         icon: "Truck",         accent: "yellow"  },
  { id: "farmWorker",     label: "Farm Workers",      icon: "Users",         accent: "orange"  },
  { id: "irrigation",     label: "Irrigation",        icon: "Droplets",      accent: "blue"    },
  { id: "harvesting",     label: "Harvesting",        icon: "Wheat",         accent: "primary" },
  { id: "packaging",      label: "Packaging & Grading",icon: "Package",     accent: "orange"  },
  { id: "insurance",      label: "Insurance Advisory", icon: "ShieldCheck",  accent: "primary" },
  { id: "legalLand",      label: "Legal & Land",      icon: "Landmark",      accent: "primary" },
  { id: "training",       label: "Training",          icon: "GraduationCap", accent: "yellow"  },
];

export const PROVIDER_TYPES = [
  { id: "individual", label: "Individual Expert" },
  { id: "clinic",     label: "Clinic / Hospital" },
  { id: "company",    label: "Company" },
  { id: "fpo",        label: "FPO" },
  { id: "cooperative",label: "Cooperative" },
  { id: "government", label: "Government Org" },
  { id: "ngo",        label: "NGO" },
];

export const BOOKING_FLOW = ["pending", "confirmed", "in_progress", "completed"];

export const BOOKING_STATUS = {
  pending:     { label: "Pending",     a: "yellow"  },
  confirmed:   { label: "Confirmed",   a: "blue"    },
  in_progress: { label: "In Progress", a: "orange"  },
  completed:   { label: "Completed",   a: "primary" },
  cancelled:   { label: "Cancelled",   a: "red"     },
  no_show:     { label: "No Show",     a: "red"     },
};

export const PRICING_TYPES = [
  { id: "fixed",    label: "Fixed" },
  { id: "hourly",   label: "Per Hour" },
  { id: "perAcre",  label: "Per Acre" },
  { id: "perVisit", label: "Per Visit" },
  { id: "perDay",   label: "Per Day" },
];

export const BOOKING_TYPES = [
  { id: "scheduled", label: "Scheduled" },
  { id: "instant",   label: "Instant" },
  { id: "emergency", label: "Emergency" },
];

export const LANGUAGES = [
  "Hindi", "Bengali", "English", "Tamil", "Telugu",
  "Kannada", "Marathi", "Gujarati", "Odia", "Punjabi",
];

export const PAYMENT_METHODS = [
  { id: "cod",  label: "Cash on Service" },
  { id: "upi",  label: "UPI on Service" },
  { id: "bank", label: "Bank Transfer (settle directly)" },
];

export const categoryMeta = (id) =>
  SERVICE_CATEGORIES.find((c) => c.id === id) ||
  { id, label: id, icon: "Handshake", accent: "primary" };
