import HerdManager from "./HerdManager.jsx";

const CONFIG = {
  enterprise: "pig",
  title: "Pig",
  noun: "Pig",
  icon: "PiggyBank",
  accent: "red",
  breeds: ["Large White Yorkshire","Landrace","Duroc","Hampshire","Ghungroo","Desi/Local","Crossbred","Other"],
  female: "Sow",
  male: "Boar",
  eventTypes: [
    { value: "vaccination", label: "Vaccination" },
    { value: "deworming",   label: "Deworming" },
    { value: "farrowing",   label: "Farrowing (birth)" },
    { value: "mating",      label: "Mating" },
    { value: "treatment",   label: "Treatment" },
    { value: "sale",        label: "Sale" },
    { value: "purchase",    label: "Purchase" },
    { value: "other",       label: "Other" },
  ],
};

export default function PigManager() {
  return <HerdManager config={CONFIG} />;
}
