/* Demo data for the service marketplace — explorable before backend exists.
   Every seeded record carries demo:true for selective clearing. */

import { repo } from "./svcDb.js";

const providers  = repo("providers");
const services   = repo("services");
const svcReviews = repo("svcReviews");
const availability = repo("availability");
const bookings   = repo("bookings");

const PROVIDERS = [
  { name: "Dr. Arun Vet Care",      type: "individual", village: "Barasat",  district: "North 24 Parganas", state: "West Bengal", icon: "Stethoscope", accent: "red",     tagline: "15 years in livestock health", specializations: ["vet"], languages: ["Bengali", "Hindi", "English"], workingHours: { start: "09:00", end: "18:00" }, verificationStatus: "verified", completedBookings: 48 },
  { name: "AgroWise Consultants",    type: "company",    village: "Hooghly",  district: "Hooghly",           state: "West Bengal", icon: "Sprout",      accent: "primary", tagline: "Soil & crop advisory",         specializations: ["agronomist", "soilTest"], languages: ["Bengali", "Hindi"], workingHours: { start: "08:00", end: "17:00" }, verificationStatus: "verified", completedBookings: 32 },
  { name: "SkySpray Drones",        type: "company",    village: "Durgapur", district: "Paschim Bardhaman", state: "West Bengal", icon: "Send",        accent: "blue",    tagline: "Precision drone spraying",     specializations: ["drone"], languages: ["Hindi", "English"], workingHours: { start: "06:00", end: "16:00" }, verificationStatus: "verified", completedBookings: 65 },
  { name: "Bengal Cold Chain",       type: "company",    village: "Burdwan",  district: "Purba Bardhaman",   state: "West Bengal", icon: "Snowflake",   accent: "blue",    tagline: "Cold storage & transport",     specializations: ["coldStorage", "transport"], languages: ["Bengali", "Hindi"], workingHours: { start: "07:00", end: "20:00" }, verificationStatus: "verified", completedBookings: 120 },
  { name: "Kisan Machinery Pool",    type: "cooperative",village: "Nadia",    district: "Nadia",             state: "West Bengal", icon: "Tractor",     accent: "yellow",  tagline: "Affordable machinery hire",    specializations: ["machineryRental", "harvesting"], languages: ["Bengali"], workingHours: { start: "06:00", end: "18:00" }, verificationStatus: "verified", completedBookings: 85 },
  { name: "Green Skills Training",   type: "ngo",        village: "Canning",  district: "South 24 Parganas", state: "West Bengal", icon: "GraduationCap",accent: "yellow", tagline: "Farmer skill development",     specializations: ["training"], languages: ["Bengali", "Hindi", "English"], workingHours: { start: "10:00", end: "16:00" }, verificationStatus: "pending", completedBookings: 22 },
];

/* [providerIdx, title, category, pricingType, price, duration(min), featured, desc] */
const SERVICES = [
  [0, "Cattle Health Checkup",       "vet",           "perVisit", 500,  60,  true,  "Complete physical exam, vitals, recommendations."],
  [0, "Poultry Flock Vaccination",   "vet",           "perVisit", 800,  90,  false, "On-farm vaccination for ND, IBD, Marek's."],
  [0, "Emergency Veterinary Visit",  "vet",           "perVisit", 1200, 120, false, "24-hour emergency call-out for critical cases."],
  [1, "Soil Testing & Report",       "soilTest",      "fixed",    350,  30,  true,  "NPK, pH, organic carbon, micronutrients. Lab report in 7 days."],
  [1, "Crop Advisory Visit",         "agronomist",    "perVisit", 600,  90,  true,  "Field inspection, pest/disease diagnosis, input plan."],
  [1, "Nutrient Management Plan",    "agronomist",    "fixed",    1500, 120, false, "Season-long fertilizer schedule based on soil test."],
  [2, "Drone Spraying per Acre",     "drone",         "perAcre",  400,  30,  true,  "Precision pesticide/fungicide spray, 8L tank."],
  [2, "Drone Field Mapping",         "drone",         "perAcre",  250,  20,  false, "High-res aerial survey with NDVI report."],
  [2, "Drone Seed Broadcasting",     "drone",         "perAcre",  350,  25,  false, "Paddy & cover crop aerial seeding."],
  [3, "Cold Storage Monthly Slot",   "coldStorage",   "fixed",    2000, 0,   true,  "10-tonne capacity, 2-8°C, 24/7 monitoring."],
  [3, "Refrigerated Transport",      "transport",     "perDay",   3500, 0,   false, "Reefer truck, Kolkata metro, up to 5 tonnes."],
  [3, "Warehouse Booking Weekly",    "coldStorage",   "fixed",    800,  0,   false, "Dry warehouse, pest-free, palletised storage."],
  [4, "Tractor Rental with Operator","machineryRental","perDay",  2500, 0,   true,  "45-HP tractor + rotavator, fuel included."],
  [4, "Combine Harvester Booking",   "harvesting",    "perAcre",  1800, 0,   true,  "Paddy combine, includes operator & fuel."],
  [4, "Power Tiller Rental",         "machineryRental","perDay",  1200, 0,   false, "12-HP power tiller for small plots."],
  [5, "Organic Farming Workshop",    "training",      "fixed",    200,  180, true,  "Hands-on vermicompost & bio-input training."],
  [5, "Poultry Management Training", "training",      "fixed",    300,  240, false, "Broiler & layer flock management for beginners."],
  [5, "Government Scheme Awareness", "training",      "fixed",    0,    120, false, "Free session: PM-KISAN, KCC, PMFBY eligibility."],
];

/* [serviceIdx, rating, author, text] */
const REVIEWS = [
  [0,  5, "Ramen M.",  "Dr. Arun diagnosed my cow's mastitis quickly. Very experienced."],
  [0,  4, "Anita K.",  "Good checkup but arrived 30 min late."],
  [3,  5, "Bishu D.",  "Soil report was detailed. Changed my fertilizer plan completely."],
  [4,  5, "Tapan S.",  "Spotted fall armyworm early, saved my maize crop."],
  [6,  5, "Habib R.",  "Drone spraying saved me 2 days of manual work. Even coverage."],
  [6,  4, "Maya B.",   "Good service but minimum 5 acres is a constraint for small farmers."],
  [9,  5, "Sk. Arif",  "Stored my potatoes for 3 months, zero spoilage. Clean facility."],
  [12, 5, "Palash G.", "Tractor with operator is very convenient. Fair price."],
];

const WEEK_SLOTS = (start, end) => {
  const slots = [];
  for (let h = parseInt(start); h < parseInt(end); h++) {
    slots.push({ start: `${String(h).padStart(2, "0")}:00`, end: `${String(h + 1).padStart(2, "0")}:00` });
  }
  return slots;
};

export const seedSvc = {
  async hasData() {
    return (await services.count()) > 0;
  },

  async load() {
    const provRecs = [];
    for (const p of PROVIDERS) {
      provRecs.push(await providers.add({ ...p, rating: 0, reviewCount: 0, kycStatus: "submitted", demo: true }));
    }

    const svcRecs = [];
    for (const [pi, title, category, pricingType, price, duration, featured, description] of SERVICES) {
      svcRecs.push(await services.add({
        providerId: provRecs[pi].id, providerName: provRecs[pi].name,
        title, category, pricingType, price, duration, featured,
        description, requirements: [], deliverables: [],
        serviceArea: provRecs[pi].district, status: "published", demo: true,
      }));
    }

    // Weekly availability for each provider (Mon-Sat)
    for (const prov of provRecs) {
      const wh = prov.workingHours || { start: "09:00", end: "17:00" };
      const slots = WEEK_SLOTS(wh.start, wh.end);
      for (let day = 1; day <= 6; day++) {
        await availability.add({ providerId: prov.id, dayOfWeek: day, slots, bufferMinutes: 15, demo: true });
      }
    }

    // Sample bookings
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    await bookings.add({ serviceId: svcRecs[0].id, serviceName: svcRecs[0].title, providerId: provRecs[0].id, providerName: provRecs[0].name, farmerId: "self", bookingType: "scheduled", date: yesterday, startTime: "10:00", endTime: "11:00", status: "completed", pricingType: "perVisit", price: 500, paymentMethod: "cod", paid: true, notes: "", location: "My farm", timeline: [{ status: "pending", at: yesterday }, { status: "confirmed", at: yesterday }, { status: "completed", at: yesterday }], demo: true });
    await bookings.add({ serviceId: svcRecs[6].id, serviceName: svcRecs[6].title, providerId: provRecs[2].id, providerName: provRecs[2].name, farmerId: "self", bookingType: "scheduled", date: today, startTime: "07:00", endTime: "08:00", status: "confirmed", pricingType: "perAcre", price: 400, paymentMethod: "upi", paid: false, notes: "5 acres paddy", location: "Barasat field", timeline: [{ status: "pending", at: today }, { status: "confirmed", at: today }], demo: true });
    await bookings.add({ serviceId: svcRecs[3].id, serviceName: svcRecs[3].title, providerId: provRecs[1].id, providerName: provRecs[1].name, farmerId: "self", bookingType: "scheduled", date: today, startTime: "14:00", endTime: "14:30", status: "pending", pricingType: "fixed", price: 350, paymentMethod: "cod", paid: false, notes: "Before rabi sowing", location: "", timeline: [{ status: "pending", at: today }], demo: true });

    // Reviews with stats update
    for (const [si, rating, author, text] of REVIEWS) {
      const svc = svcRecs[si];
      await svcReviews.add({ serviceId: svc.id, providerId: svc.providerId, rating, author, text, verified: true, demo: true });
    }

    // Update provider ratings from reviews
    for (const prov of provRecs) {
      const rvs = await svcReviews.getBy("providerId", prov.id);
      if (rvs.length) {
        const avg = Math.round((rvs.reduce((s, r) => s + r.rating, 0) / rvs.length) * 10) / 10;
        await providers.update(prov.id, { rating: avg, reviewCount: rvs.length });
      }
    }

    return { providers: provRecs.length, services: svcRecs.length };
  },

  async clear() {
    for (const r of [providers, services, svcReviews, availability, bookings]) {
      const list = await r.getAll();
      await Promise.all(list.filter((x) => x.demo).map((x) => r.remove(x.id)));
    }
  },
};
