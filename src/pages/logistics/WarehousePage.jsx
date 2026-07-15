import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import Icon from "../../components/Icon.jsx";
import { AppBar, Chip, Button, EmptyState } from "../../components/index.js";
import { BottomSheet } from "../../components/overlays.jsx";
import { Input, Dropdown } from "../../components/inputs.jsx";
import { useApp } from "../../store/AppStore.jsx";
import WarehouseCard from "../../components/logistics/WarehouseCard.jsx";
import CapacityBar, { tonnes } from "../../components/logistics/CapacityBar.jsx";
import TelemetryGauge from "../../components/logistics/TelemetryGauge.jsx";
import { warehouseService } from "../../services/logistics/warehouseService.js";
import { storageBookingService } from "../../services/logistics/storageBookingService.js";
import { telemetryService } from "../../services/logistics/telemetryService.js";
import { WAREHOUSE_TYPES, COMMODITIES, PLACES, placeById } from "../../services/logistics/constantsLog.js";
import { rupee } from "../../utils/format.js";

const EMPTY_WH = { name: "", type: "dry", place: "barasat", capacityKg: "", pricePerTonneMonth: "", ownerName: "" };
const EMPTY_BK = { commodity: "Potato", quantityKg: "", months: "1" };

export default function WarehousePage() {
  const { pop, toast } = useApp();
  const [list, setList] = useState(null);
  const [filter, setFilter] = useState("all");
  const [detail, setDetail] = useState(null);
  const [mon, setMon] = useState(null);
  const [regOpen, setRegOpen] = useState(false);
  const [wh, setWh] = useState(EMPTY_WH);
  const [bk, setBk] = useState(EMPTY_BK);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  useEffect(() => { warehouseService.getAll().then(setList); }, [tick]);

  const openDetail = async (w) => {
    setDetail(w); setBk(EMPTY_BK);
    setMon(w.cold ? await warehouseService.monitoring(w.id) : null);
  };

  const register = async () => {
    if (!wh.name || !wh.capacityKg) { toast("Enter name and capacity", "error"); return; }
    const g = placeById(wh.place);
    await warehouseService.register({
      name: wh.name, type: wh.type, ownerName: wh.ownerName || "Me",
      village: g.name, district: g.name, state: "West Bengal", lat: g.lat, lon: g.lon,
      capacityKg: Number(wh.capacityKg) * 1000, pricePerTonneMonth: wh.pricePerTonneMonth,
    });
    toast("Warehouse registered", "success"); setWh(EMPTY_WH); setRegOpen(false); refresh();
  };

  const book = async () => {
    if (!bk.quantityKg) { toast("Enter quantity", "error"); return; }
    try {
      await storageBookingService.create({
        warehouseId: detail.id, commodity: bk.commodity,
        quantityKg: Number(bk.quantityKg) * 1000, months: bk.months,
      });
      toast("Storage booked", "success");
      const fresh = await warehouseService.getById(detail.id);
      setDetail(fresh); setBk(EMPTY_BK); refresh();
    } catch (e) { toast(e.message, "error"); }
  };

  const simulate = async () => {
    await telemetryService.simulate(detail.id, "temperature", { base: 5, jitter: 2, count: 1 });
    await telemetryService.simulate(detail.id, "humidity", { base: 60, jitter: 6, count: 1 });
    setMon(await warehouseService.monitoring(detail.id));
    toast("Sensors refreshed", "info");
  };

  const shown = (list || []).filter((w) => filter === "all" ? true : filter === "cold" ? w.cold : w.type === filter);

  return (
    <>
      <AppBar title="Warehousing" onBack={pop}
        action={<Button size="sm" icon="Plus" onClick={() => setRegOpen(true)}>List</Button>} />
      <div style={{ padding: "4px 16px 32px", display: "flex", flexDirection: "column", gap: 14,
        animation: "ag-fade .25s var(--ag-ease)" }}>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>All</Chip>
          <Chip active={filter === "cold"} onClick={() => setFilter("cold")} icon="Snowflake">Cold</Chip>
          {WAREHOUSE_TYPES.map((w) => (
            <Chip key={w.id} active={filter === w.id} onClick={() => setFilter(w.id)} icon={w.icon}>{w.label}</Chip>
          ))}
        </div>

        {list === null ? null : shown.length === 0 ? (
          <EmptyState icon="Warehouse" title="No facilities"
            body="No warehouses in this filter. List your own storage to rent it out." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {shown.map((w) => <WarehouseCard key={w.id} warehouse={w} onClick={() => openDetail(w)} />)}
          </div>
        )}
      </div>

      {/* detail + booking */}
      <BottomSheet open={!!detail} onClose={() => setDetail(null)} title={detail?.name}>
        {detail && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 12.5, color: T.inkSoft }}>
              {detail.village} · {rupee(detail.pricePerTonneMonth)}/tonne·month
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, marginBottom: 6 }}>Capacity</div>
              <CapacityBar used={detail.allocatedKg} total={detail.capacityKg} />
            </div>

            {detail.cold && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft }}>Cold-chain monitoring</span>
                  <button onClick={simulate} style={{ background: "none", border: "none", cursor: "pointer", color: T.blue, display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                    <Icon name="RefreshCw" size={13} /> refresh
                  </button>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <TelemetryGauge kind="temperature" reading={mon?.temperature} breach={mon?.tempBreach} band={detail.tempBand} />
                  <TelemetryGauge kind="humidity" reading={mon?.humidity} breach={mon?.humidityBreach} band={detail.humidityBand} />
                </div>
              </div>
            )}

            <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 10 }}>Book storage</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Dropdown label="Commodity" value={bk.commodity} onChange={(v) => setBk({ ...bk, commodity: v })}
                  options={COMMODITIES.map((c) => ({ value: c, label: c }))} />
                <Input label="Quantity (tonnes)" value={bk.quantityKg} onChange={(v) => setBk({ ...bk, quantityKg: v })} icon="Scale" type="number" />
                <Input label="Duration (months)" value={bk.months} onChange={(v) => setBk({ ...bk, months: v })} icon="Calendar" type="number" />
                <div style={{ fontSize: 12, color: T.inkSoft }}>
                  Free capacity: <b style={{ color: T.ink }}>{tonnes(warehouseService.availableKg(detail))} t</b>
                  {bk.quantityKg && Number(bk.months) ? <> · est. <b style={{ color: T.ink }}>{rupee(Number(bk.quantityKg) * detail.pricePerTonneMonth * Number(bk.months))}</b></> : null}
                </div>
                <Button full icon="Check" onClick={book}>Book storage</Button>
              </div>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* register warehouse */}
      <BottomSheet open={regOpen} onClose={() => setRegOpen(false)} title="List Storage Facility">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Facility Name" value={wh.name} onChange={(v) => setWh({ ...wh, name: v })} icon="Warehouse" />
          <Dropdown label="Type" value={wh.type} onChange={(v) => setWh({ ...wh, type: v })}
            options={WAREHOUSE_TYPES.map((w) => ({ value: w.id, label: w.label }))} />
          <Dropdown label="Location" value={wh.place} onChange={(v) => setWh({ ...wh, place: v })}
            options={PLACES.map((p) => ({ value: p.id, label: p.name }))} />
          <Input label="Capacity (tonnes)" value={wh.capacityKg} onChange={(v) => setWh({ ...wh, capacityKg: v })} icon="Boxes" type="number" />
          <Input label="Price (₹/tonne·month)" value={wh.pricePerTonneMonth} onChange={(v) => setWh({ ...wh, pricePerTonneMonth: v })} icon="IndianRupee" type="number" />
          <Input label="Owner Name" value={wh.ownerName} onChange={(v) => setWh({ ...wh, ownerName: v })} icon="User" />
          <Button full icon="Check" onClick={register}>Register facility</Button>
        </div>
      </BottomSheet>
    </>
  );
}
