import HerdManager from "./HerdManager.jsx";

/* Goat management now delegates to the shared HerdManager (Phase 6) —
   goat, pig and sheep share identical workflows, so one implementation. */
const CONFIG = {
  enterprise: "goat",
  title: "Goat",
  noun: "Goat",
  icon: "Rabbit",
  accent: "primary",
  breeds: ["Black Bengal","Sirohi","Barbari","Beetal","Jamunapari","Osmanabadi","Mixed","Other"],
  female: "Doe",
  male: "Buck",
  eventTypes: [
    { value: "vaccination", label: "Vaccination" },
    { value: "deworming",   label: "Deworming" },
    { value: "kidding",     label: "Kidding (birth)" },
    { value: "mating",      label: "Mating" },
    { value: "treatment",   label: "Treatment" },
    { value: "sale",        label: "Sale" },
    { value: "purchase",    label: "Purchase" },
    { value: "other",       label: "Other" },
  ],
};

export default function GoatManager() {
  return <HerdManager config={CONFIG} />;
}
