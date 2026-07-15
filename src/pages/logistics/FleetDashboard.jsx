import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Card, Chip, Button, EmptyState, IconTile } from "../../components/index.js";
import { BottomSheet, Dialog } from "../../components/overlays.jsx";
import { Input, Dropdown } from "../../components/inputs.jsx";
import { useApp } from "../../store/AppStore.jsx";
import StatTile from "../../components/erp/StatTile.jsx";
import { EmptyHint } from "../../components/erp/RecordList.jsx";
import VehicleCard from "../../components/logistics/VehicleCard.jsx";
import DriverCard from "../../components/logistics/DriverCard.jsx";
import ShipmentCard from "../../components/logistics/ShipmentCard.jsx";
import { transportService } from "../../services/logistics/transportService.js";
import { fleetService } from "../../services/logistics/fleetService.js";
import { driverService } from "../../services/logistics/driverService.js";
import { shipmentService } from "../../services/logistics/shipmentService.js";
import { PROVIDER_TYPES, VEHICLE_CATEGORIES, SHIPMENT_STATUS } from "../../services/logistics/constantsLog.js";
import { rupee, compact } from "../../utils/format.js";

const EMPTY_VEH = { category: "truck", regNumber: "", model: "", insuranceExpiry: "", fitnessExpiry: "", permitExpiry: "" };
const EMPTY_DRV = { name: "", phone: "", licenseNumber: "", licenseExpiry: "", languages: "" };

export default function FleetDashboard() {
  const { pop, push, toast } = useApp();
  const [provider, setProvider] = useState(undefined);
  const [tab, setTab] = useState("vehicles");
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [mine, setMine] = useState([]);
  const [summary, setSummary] = useState({ total: 0, active: 0, delivered: 0, earnings: 0 });
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  // registration
  const [reg, setReg] = useState({ name: "", type: "fleet", tagline: "", village: "", district: "", phone: "" });
  const [regOpen, setRegOpen] = useState(false);

  // vehicle / driver / assign sheets
  const [vehForm, setVehForm] = useState(EMPTY_VEH);
  const [vehOpen, setVehOpen] = useState(false);
  const [delVeh, setDelVeh] = useState(null);
  const [drvForm, setDrvForm] = useState(EMPTY_DRV);
  const [drvOpen, setDrvOpen] = useState(false);
  const [assignFor, setAssignFor] = useState(null);
  const [assignSel, setAssignSel] = useState({ vehicleId: "", driverId: "" });

  useEffect(() => {
    transportService.getMine().then((p) => {
      setProvider(p || null);
      if (!p) return;
      fleetService.byProvider(p.id).then(setVehicles);
      driverService.byProvider(p.id).then(setDrivers);
      shipmentService.unassigned().then(setJobs);
      shipmentService.byProvider(p.id).then(setMine);
      shipmentService.providerSummary(p.id).then(setSummary);
    });
  }, [tick]);

  const doRegister = async () => {
    if (!reg.name) { toast("Enter a business name", "error"); return; }
    await transportService.register(reg);
    toast("Transport profile created!", "success"); refresh();
  };

  const addVehicle = async () => {
    if (!vehForm.regNumber) { toast("Enter registration number", "error"); return; }
    await fleetService.register({
      providerId: provider.id, providerName: provider.name,
      category: vehForm.category, regNumber: vehForm.regNumber, model: vehForm.model,
      documents: { insuranceExpiry: vehForm.insuranceExpiry, fitnessExpiry: vehForm.fitnessExpiry, permitExpiry: vehForm.permitExpiry },
    });
    toast("Vehicle added", "success"); setVehForm(EMPTY_VEH); setVehOpen(false); refresh();
  };

  const addDriver = async () => {
    if (!drvForm.name) { toast("Enter driver name", "error"); return; }
    await driverService.register({
      providerId: provider.id, providerName: provider.name,
      name: drvForm.name, phone: drvForm.phone, licenseNumber: drvForm.licenseNumber,
      licenseExpiry: drvForm.licenseExpiry,
      languages: drvForm.languages ? drvForm.languages.split(",").map((s) => s.trim()).filter(Boolean) : [],
    });
    toast("Driver added", "success"); setDrvForm(EMPTY_DRV); setDrvOpen(false); refresh();
  };

  const doAssign = async () => {
    if (!assignSel.vehicleId || !assignSel.driverId) { toast("Pick a vehicle and driver", "error"); return; }
    try {
      await shipmentService.assign(assignFor.id, { providerId: provider.id, ...assignSel });
      toast("Shipment assigned", "success");
    } catch (e) { toast(e.message, "error"); }
    setAssignFor(null); setAssignSel({ vehicleId: "", driverId: "" }); refresh();
  };

  const advanceJob = async (s) => {
    const next = shipmentService.nextStatus(s.status);
    if (!next) return;
    if (next === "delivered") { await shipmentService.confirmDelivery(s.id, { receivedBy: "Recipient" }); }
    else await shipmentService.setStatus(s.id, next);
    toast(`Marked ${SHIPMENT_STATUS[next]?.label}`, "success"); refresh();
  };

  // ---- onboarding ----
  if (provider === undefined) return <><AppBar title="Fleet & Drivers" onBack={pop} /></>;
  if (provider === null) {
    return (
      <>
        <AppBar title="Fleet & Drivers" onBack={pop} />
        <div style={{ padding: "8px 16px 32px", animation: "ag-fade .25s var(--ag-ease)" }}>
          <Card pad={18} style={{ textAlign: "center" }}>
            <IconTile name="Truck" a="blue" size={56} iconSize={28} style={{ margin: "0 auto" }} />
            <div style={{ fontSize: 17, fontWeight: 800, color: T.ink, marginTop: 12 }}>Become a Transport Provider</div>
            <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 6, lineHeight: 1.5 }}>
              Register your fleet, add drivers, accept shipment jobs from farmers and buyers, and track deliveries.
            </div>
          </Card>
          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {[
              ["Truck", "Register your fleet", "Add vehicles with documents & capacity"],
              ["User", "Manage drivers", "License & identity verification, ratings"],
              ["Package", "Accept jobs", "Assign vehicles and track to delivery"],
            ].map(([icon, title, desc]) => (
              <Card key={title} pad={13}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <IconTile name={icon} a="primary" size={38} iconSize={19} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>{title}</div>
                    <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 1 }}>{desc}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Button full icon="Plus" onClick={() => setRegOpen(true)} style={{ marginTop: 16 }}>Create Transport Profile</Button>
        </div>

        <BottomSheet open={regOpen} onClose={() => setRegOpen(false)} title="Transport Registration">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Input label="Business Name" value={reg.name} onChange={(v) => setReg({ ...reg, name: v })} icon="Truck" />
            <Dropdown label="Provider Type" value={reg.type} onChange={(v) => setReg({ ...reg, type: v })}
              options={PROVIDER_TYPES.map((t) => ({ value: t.id, label: t.label }))} />
            <Input label="Tagline" value={reg.tagline} onChange={(v) => setReg({ ...reg, tagline: v })} icon="FileText" placeholder="Short description…" />
            <Input label="Village" value={reg.village} onChange={(v) => setReg({ ...reg, village: v })} icon="MapPin" />
            <Input label="District" value={reg.district} onChange={(v) => setReg({ ...reg, district: v })} icon="Map" />
            <Input label="Phone" value={reg.phone} onChange={(v) => setReg({ ...reg, phone: v })} icon="Phone" />
            <Button full icon="Check" onClick={doRegister}>Register</Button>
          </div>
        </BottomSheet>
      </>
    );
  }

  // ---- dashboard ----
  const TABS = [
    { id: "vehicles", label: "Vehicles" },
    { id: "drivers", label: "Drivers" },
    { id: "jobs", label: "Jobs" },
  ];

  return (
    <>
      <AppBar title={provider.name} onBack={pop} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 14,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
          <StatTile label="Vehicles" value={vehicles.length} icon="Truck" a="blue" />
          <StatTile label="Drivers" value={drivers.length} icon="User" a="primary" />
          <StatTile label="Active Jobs" value={summary.active} icon="Navigation" a="orange" />
          <StatTile label="Earnings" value={compact(summary.earnings)} icon="IndianRupee" a="primary" />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {TABS.map((tb) => (
            <Chip key={tb.id} active={tab === tb.id} onClick={() => setTab(tb.id)}>{tb.label}</Chip>
          ))}
        </div>

        {tab === "vehicles" && (
          <>
            <Button variant="soft" full icon="Plus" onClick={() => setVehOpen(true)}>Add Vehicle</Button>
            {vehicles.length === 0 ? <EmptyHint icon="Truck" text="No vehicles yet." /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {vehicles.map((v) => <VehicleCard key={v.id} vehicle={v} onDelete={() => setDelVeh(v)} />)}
              </div>
            )}
          </>
        )}

        {tab === "drivers" && (
          <>
            <Button variant="soft" full icon="Plus" onClick={() => setDrvOpen(true)}>Add Driver</Button>
            {drivers.length === 0 ? <EmptyHint icon="User" text="No drivers yet." /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {drivers.map((d) => (
                  <div key={d.id}>
                    <DriverCard driver={d} />
                    {!(d.licenseVerified && d.identityVerified) && (
                      <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                        {!d.licenseVerified && (
                          <Button size="sm" variant="outline" icon="ShieldCheck"
                            onClick={async () => { await driverService.verify(d.id, "license"); toast("License verified", "success"); refresh(); }}>License</Button>
                        )}
                        {!d.identityVerified && (
                          <Button size="sm" variant="outline" icon="UserCheck"
                            onClick={async () => { await driverService.verify(d.id, "identity"); toast("Identity verified", "success"); refresh(); }}>Identity</Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "jobs" && (
          <>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.inkSoft }}>Open jobs (unassigned)</div>
            {jobs.length === 0 ? <EmptyHint icon="Inbox" text="No open jobs right now." /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {jobs.map((s) => (
                  <div key={s.id}>
                    <ShipmentCard shipment={s} onClick={() => push({ kind: "logShipmentDetail", props: { shipmentId: s.id } })} />
                    <Button size="sm" variant="soft" icon="Check" onClick={() => { setAssignFor(s); setAssignSel({ vehicleId: "", driverId: "" }); }}
                      style={{ marginTop: 6 }}>Accept & assign</Button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.inkSoft, marginTop: 6 }}>My shipments</div>
            {mine.length === 0 ? <EmptyHint icon="Package" text="No assigned shipments." /> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {mine.map((s) => (
                  <div key={s.id}>
                    <ShipmentCard shipment={s} onClick={() => push({ kind: "logShipmentDetail", props: { shipmentId: s.id } })} />
                    {shipmentService.nextStatus(s.status) && (
                      <Button size="sm" variant="outline" icon="ArrowRight" onClick={() => advanceJob(s)} style={{ marginTop: 6 }}>
                        Mark {SHIPMENT_STATUS[shipmentService.nextStatus(s.status)]?.label}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* add vehicle */}
      <BottomSheet open={vehOpen} onClose={() => setVehOpen(false)} title="Add Vehicle">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Dropdown label="Category" value={vehForm.category} onChange={(v) => setVehForm({ ...vehForm, category: v })}
            options={VEHICLE_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))} />
          <Input label="Registration Number" value={vehForm.regNumber} onChange={(v) => setVehForm({ ...vehForm, regNumber: v })} icon="Truck" placeholder="WB-00-XX-0000" />
          <Input label="Model (optional)" value={vehForm.model} onChange={(v) => setVehForm({ ...vehForm, model: v })} icon="FileText" />
          <Input label="Insurance Expiry" value={vehForm.insuranceExpiry} onChange={(v) => setVehForm({ ...vehForm, insuranceExpiry: v })} icon="Calendar" type="date" />
          <Input label="Fitness Expiry" value={vehForm.fitnessExpiry} onChange={(v) => setVehForm({ ...vehForm, fitnessExpiry: v })} icon="Calendar" type="date" />
          <Input label="Permit Expiry" value={vehForm.permitExpiry} onChange={(v) => setVehForm({ ...vehForm, permitExpiry: v })} icon="Calendar" type="date" />
          <Button full icon="Check" onClick={addVehicle}>Add Vehicle</Button>
        </div>
      </BottomSheet>

      {/* add driver */}
      <BottomSheet open={drvOpen} onClose={() => setDrvOpen(false)} title="Add Driver">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Name" value={drvForm.name} onChange={(v) => setDrvForm({ ...drvForm, name: v })} icon="User" />
          <Input label="Phone" value={drvForm.phone} onChange={(v) => setDrvForm({ ...drvForm, phone: v })} icon="Phone" />
          <Input label="License Number" value={drvForm.licenseNumber} onChange={(v) => setDrvForm({ ...drvForm, licenseNumber: v })} icon="CreditCard" />
          <Input label="License Expiry" value={drvForm.licenseExpiry} onChange={(v) => setDrvForm({ ...drvForm, licenseExpiry: v })} icon="Calendar" type="date" />
          <Input label="Languages (comma-sep)" value={drvForm.languages} onChange={(v) => setDrvForm({ ...drvForm, languages: v })} icon="Languages" placeholder="Bengali, Hindi" />
          <Button full icon="Check" onClick={addDriver}>Add Driver</Button>
        </div>
      </BottomSheet>

      {/* assign */}
      <BottomSheet open={!!assignFor} onClose={() => setAssignFor(null)} title="Assign Shipment">
        {assignFor && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 13, color: T.inkSoft }}>
              {assignFor.commodity} · {(assignFor.quantityKg / 1000).toLocaleString("en-IN")} t · {assignFor.pickup?.name} → {assignFor.drop?.name}
            </div>
            <Dropdown label="Vehicle" value={assignSel.vehicleId} onChange={(v) => setAssignSel({ ...assignSel, vehicleId: v })}
              options={[{ value: "", label: "Select vehicle…" }, ...vehicles.filter((v) => v.available).map((v) => ({ value: v.id, label: `${v.regNumber} · ${(v.capacityKg / 1000)}t` }))]} />
            <Dropdown label="Driver" value={assignSel.driverId} onChange={(v) => setAssignSel({ ...assignSel, driverId: v })}
              options={[{ value: "", label: "Select driver…" }, ...drivers.filter((d) => d.status === "available").map((d) => ({ value: d.id, label: d.name }))]} />
            <Button full icon="Check" onClick={doAssign}>Confirm assignment</Button>
          </div>
        )}
      </BottomSheet>

      <Dialog open={!!delVeh} onClose={() => setDelVeh(null)} title="Remove vehicle?" icon="Trash2" danger
        body="This vehicle will be removed from your fleet."
        confirmLabel="Remove"
        onConfirm={async () => { await fleetService.remove(delVeh.id); toast("Vehicle removed", "info"); refresh(); }} />
    </>
  );
}
