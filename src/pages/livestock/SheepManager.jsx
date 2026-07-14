import HerdManager from "./HerdManager.jsx";

const CONFIG = {
  enterprise: "sheep",
  title: "Sheep",
  noun: "Sheep",
  icon: "Beef",
  accent: "blue",
  breeds: ["Deccani","Nellore","Marwari","Garole","Chokla","Merino Cross","Desi/Local","Other"],
  female: "Ewe",
  male: "Ram",
  eventTypes: [
    { value: "vaccination", label: "Vaccination" },
    { value: "deworming",   label: "Deworming" },
    { value: "lambing",     label: "Lambing (birth)" },
    { value: "shearing",    label: "Shearing (wool)" },
    { value: "mating",      label: "Mating" },
    { value: "treatment",   label: "Treatment" },
    { value: "sale",        label: "Sale" },
    { value: "purchase",    label: "Purchase" },
    { value: "other",       label: "Other" },
  ],
};

export default function SheepManager() {
  return <HerdManager config={CONFIG} />;
}
