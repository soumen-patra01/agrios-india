import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Card, Chip, Button } from "../../components/index.js";
import { BottomSheet, Input, Dropdown, Dialog } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import { animalService, productionService, eventService } from "../../services/livestock/livestockService.js";
import { rupee } from "../../utils/format.js";

const TABS = ["Hives", "Honey Log", "Inspections"];
const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtDate  = (d) => new Date(d + "T12:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default function BeeManager() {
  const { pop, toast } = useApp();
  const [tab, setTab]       = useState("Hives");
  const [hives, setHives]   = useState([]);
  const [prods, setProds]   = useState([]);
  const [events, setEvents] = useState([]);
  const [tick, setTick]     = useState(0);
  const refresh = () => setTick((n) => n + 1);

  const [hiveOpen, setHiveOpen] = useState(false);
  const [hiveForm, setHiveForm] = useState({ name: "", location: "", colonyStrength: "strong", installedDate: todayStr() });

  const [prodOpen, setProdOpen] = useState(false);
  const [prodForm, setProdForm] = useState({ date: todayStr(), honeyKg: "", hiveId: "", pricePerKg: "" });

  const [eventOpen, setEventOpen] = useState(false);
  const [eventForm, setEventForm] = useState({ date: todayStr(), type: "inspection", note: "", queenStatus: "present" });

  const [delId, setDelId]     = useState(null);
  const [delStore, setDelStore] = useState(null);

  useEffect(() => {
    animalService.getAll("bee").then(setHives);
    productionService.getForEnterprise("bee", 60).then(setProds);
    eventService.getForEnterprise("bee").then(setEvents);
  }, [tick]);

  const totalHoney = prods.reduce((s, p) => s + (Number(p.honeyKg) || 0), 0);
  const hiveOptions = [{ value: "", label: "All hives" }, ...hives.map((h) => ({ value: h.id, label: h.name }))];

  const addHive = async () => {
    if (!hiveForm.name) return;
    await animalService.add({ ...hiveForm, enterprise: "bee" });
    setHiveOpen(false); setHiveForm({ name: "", location: "", colonyStrength: "strong", installedDate: todayStr() });
    refresh(); toast("Hive added", "success");
  };

  const addProd = async () => {
    if (!prodForm.honeyKg) return;
    await productionService.add({ ...prodForm, enterprise: "bee", quantity: Number(prodForm.honeyKg) });
    setProdOpen(false); setProdForm({ date: todayStr(), honeyKg: "", hiveId: "", pricePerKg: "" });
    refresh(); toast("Honey harvest logged", "success");
  };

  const addEvent = async () => {
    await eventService.add({ ...eventForm, enterprise: "bee" });
    setEventOpen(false); setEventForm({ date: todayStr(), type: "inspection", note: "", queenStatus: "present" });
    refresh(); toast("Event saved", "success");
  };

  const handleDelete = async () => {
    if (delStore === "animals")     await animalService.remove(delId);
    if (delStore === "productions") await productionService.remove(delId);
    if (delStore === "events")      await eventService.remove(delId);
    setDelId(null); setDelStore(null); refresh(); toast("Deleted", "info");
  };

  const strengthColor = { strong: T.primary, medium: T.orange, weak: T.red };

  return (
    <>
      <AppBar title="Beekeeping" onBack={pop} action={
        <button onClick={() => tab === "Hives" ? setHiveOpen(true) : tab === "Honey Log" ? setProdOpen(true) : setEventOpen(true)}
          style={{ background: T.yellow, border: "none", borderRadius: 12, padding: "8px 13px",
            cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", gap: 6,
            fontFamily: T.body, fontSize: 13, fontWeight: 600 }}>
          <Icon name="Plus" size={15} color="#fff" /> Add
        </button>
      } />

      <div style={{ display: "flex", gap: 10, padding: "8px 16px 4px", overflowX: "auto" }}>
        {[
          { label: "Hives", value: hives.length },
          { label: "Total Honey (kg)", value: totalHoney.toFixed(1) },
          { label: "Inspections", value: events.filter((e) => e.type === "inspection").length },
        ].map((s) => (
          <div key={s.label} style={{ flexShrink: 0, background: T.yellowSoft, borderRadius: T.rMd, padding: "10px 14px", minWidth: 100 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.yellow, fontFamily: T.display }}>{s.value}</div>
            <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, padding: "10px 16px 4px" }}>
        {TABS.map((t) => <Chip key={t} active={tab === t} onClick={() => setTab(t)}>{t}</Chip>)}
      </div>

      <div style={{ padding: "8px 16px 32px", display: "flex", flexDirection: "column", gap: 8 }}>
        {tab === "Hives" && (
          hives.length === 0
            ? <EmptyHint icon="Bug" text="Register your bee boxes to start tracking" />
            : hives.map((h) => (
              <Card key={h.id} pad={14}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: T.yellowSoft, display: "grid", placeItems: "center" }}>
                      <Icon name="Bug" size={20} color={T.yellow} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{h.name}</div>
                      <div style={{ fontSize: 12, color: T.inkSoft }}>
                        {h.location || "No location"}
                        <span style={{ marginLeft: 6, background: h.colonyStrength === "strong" ? T.primarySoft : h.colonyStrength === "medium" ? T.orangeSoft : T.redSoft,
                          color: strengthColor[h.colonyStrength] || T.primary,
                          borderRadius: 5, padding: "1px 6px", fontSize: 10, fontWeight: 600 }}>
                          {h.colonyStrength}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { setDelId(h.id); setDelStore("animals"); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: T.inkFaint, padding: 4 }}>
                    <Icon name="Trash2" size={15} />
                  </button>
                </div>
              </Card>
            ))
        )}

        {tab === "Honey Log" && (
          prods.length === 0
            ? <EmptyHint icon="Droplets" text="Log each honey harvest to track your yield" />
            : prods.slice(0, 30).map((p) => (
              <Card key={p.id} pad={12}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{fmtDate(p.date)}</div>
                    <div style={{ fontSize: 12, color: T.inkSoft }}>
                      🍯 {p.honeyKg} kg
                      {p.pricePerKg ? ` · ${rupee(p.pricePerKg)}/kg` : ""}
                      {p.hiveId ? ` · ${hives.find((h) => h.id === p.hiveId)?.name || ""}` : ""}
                    </div>
                  </div>
                  <button onClick={() => { setDelId(p.id); setDelStore("productions"); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: T.inkFaint, padding: 4 }}>
                    <Icon name="Trash2" size={15} />
                  </button>
                </div>
              </Card>
            ))
        )}

        {tab === "Inspections" && (
          events.length === 0
            ? <EmptyHint icon="Search" text="Log hive inspections to monitor colony health" />
            : events.slice(0, 30).map((ev) => (
              <Card key={ev.id} pad={12}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, textTransform: "capitalize" }}>{ev.type.replace(/_/g, " ")}</div>
                    <div style={{ fontSize: 12, color: T.inkSoft }}>
                      {fmtDate(ev.date)}
                      {ev.queenStatus ? ` · Queen: ${ev.queenStatus}` : ""}
                      {ev.note ? ` · ${ev.note}` : ""}
                    </div>
                  </div>
                  <button onClick={() => { setDelId(ev.id); setDelStore("events"); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: T.inkFaint, padding: 4 }}>
                    <Icon name="Trash2" size={15} />
                  </button>
                </div>
              </Card>
            ))
        )}
      </div>

      <BottomSheet open={hiveOpen} onClose={() => setHiveOpen(false)} title="Add Hive">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Hive name / number" placeholder="e.g. Box 1" value={hiveForm.name} onChange={(v) => setHiveForm((f) => ({ ...f, name: v }))} />
          <Input label="Location" placeholder="e.g. Mango orchard" value={hiveForm.location} onChange={(v) => setHiveForm((f) => ({ ...f, location: v }))} />
          <Dropdown label="Colony strength" value={hiveForm.colonyStrength} onChange={(v) => setHiveForm((f) => ({ ...f, colonyStrength: v }))}
            options={[{ value: "strong", label: "Strong" }, { value: "medium", label: "Medium" }, { value: "weak", label: "Weak" }]} />
          <Input label="Installation date" type="date" value={hiveForm.installedDate} onChange={(v) => setHiveForm((f) => ({ ...f, installedDate: v }))} />
          <Button full onClick={addHive} disabled={!hiveForm.name}>Add Hive</Button>
        </div>
      </BottomSheet>

      <BottomSheet open={prodOpen} onClose={() => setProdOpen(false)} title="Log Honey Harvest">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Date" type="date" value={prodForm.date} onChange={(v) => setProdForm((f) => ({ ...f, date: v }))} />
          <Dropdown label="Hive (optional)" value={prodForm.hiveId} onChange={(v) => setProdForm((f) => ({ ...f, hiveId: v }))} options={hiveOptions} />
          <Input label="Honey collected (kg)" type="number" placeholder="0" value={prodForm.honeyKg} onChange={(v) => setProdForm((f) => ({ ...f, honeyKg: v }))} />
          <Input label="Sale price (₹/kg)" type="number" placeholder="0" value={prodForm.pricePerKg} onChange={(v) => setProdForm((f) => ({ ...f, pricePerKg: v }))} />
          <Button full onClick={addProd} disabled={!prodForm.honeyKg}>Save Harvest</Button>
        </div>
      </BottomSheet>

      <BottomSheet open={eventOpen} onClose={() => setEventOpen(false)} title="Add Inspection / Event">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Date" type="date" value={eventForm.date} onChange={(v) => setEventForm((f) => ({ ...f, date: v }))} />
          <Dropdown label="Type" value={eventForm.type} onChange={(v) => setEventForm((f) => ({ ...f, type: v }))}
            options={[
              { value: "inspection",   label: "Hive Inspection" },
              { value: "treatment",    label: "Treatment / Medication" },
              { value: "supering",     label: "Supering (add box)" },
              { value: "splitting",    label: "Colony Splitting" },
              { value: "requeening",   label: "Re-queening" },
              { value: "other",        label: "Other" },
            ]} />
          <Dropdown label="Queen status" value={eventForm.queenStatus} onChange={(v) => setEventForm((f) => ({ ...f, queenStatus: v }))}
            options={[{ value: "present", label: "Queen Present" }, { value: "absent", label: "Queen Absent" }, { value: "unknown", label: "Not Checked" }]} />
          <Input label="Notes" placeholder="Observations…" value={eventForm.note} onChange={(v) => setEventForm((f) => ({ ...f, note: v }))} />
          <Button full onClick={addEvent}>Save</Button>
        </div>
      </BottomSheet>

      <Dialog open={!!delId} title="Delete?" onClose={() => { setDelId(null); setDelStore(null); }}
        actions={[
          { label: "Cancel", variant: "outline", onClick: () => { setDelId(null); setDelStore(null); } },
          { label: "Delete", variant: "danger",  onClick: handleDelete },
        ]}>
        <div style={{ fontSize: 14, color: T.inkSoft }}>This record will be permanently removed.</div>
      </Dialog>
    </>
  );
}

function EmptyHint({ icon, text }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px", color: T.inkFaint }}>
      <Icon name={icon} size={36} color={T.line} />
      <div style={{ marginTop: 12, fontSize: 13 }}>{text}</div>
    </div>
  );
}
