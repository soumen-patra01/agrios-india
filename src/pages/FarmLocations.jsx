import { useState } from "react";
import { T } from "../theme/ThemeProvider.jsx";
import Icon from "../components/Icon.jsx";
import { AppBar, Screen, Card, Button, Input, EmptyState, Spinner, Dialog } from "../components/index.js";
import MapView from "../components/MapView.jsx";
import { useApp } from "../store/AppStore.jsx";
import { locationService } from "../services/location/locationService.js";
import { searchPlaces } from "../services/location/geocoding.js";

export default function FarmLocations() {
  const { pop, toast } = useApp();
  const [farms, setFarms] = useState(() => locationService.list());
  const [active, setActiveState] = useState(() => locationService.getActive()?.id || null);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  const refresh = () => {
    setFarms(locationService.list());
    setActiveState(locationService.getActive()?.id || null);
  };

  const useGPS = async () => {
    setGpsBusy(true);
    try {
      const pos = await locationService.currentPosition();
      locationService.add({ name: pos.name, lat: pos.lat, lon: pos.lon });
      refresh();
      toast("Location added", "success");
    } catch (e) {
      toast(e.message || "Couldn't get your location", "error");
    } finally {
      setGpsBusy(false);
    }
  };

  const runSearch = async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    try {
      setResults(await searchPlaces(q));
    } catch {
      toast("Search failed — check your connection", "error");
    } finally {
      setSearching(false);
    }
  };

  const addPlace = (p) => {
    locationService.add({ name: p.label, lat: p.lat, lon: p.lon });
    setQuery(""); setResults([]);
    refresh();
    toast("Location added", "success");
  };

  const makeActive = (id) => { locationService.setActive(id); setActiveState(id); };

  const doDelete = () => {
    if (confirmDel) { locationService.remove(confirmDel.id); refresh(); }
    setConfirmDel(null);
  };

  return (
    <>
      <AppBar title="Farm locations" onBack={pop} />
      <Screen gap={16}>
        {/* add via GPS */}
        <Button variant="primary" icon="LocateFixed" full onClick={useGPS} disabled={gpsBusy}>
          {gpsBusy ? "Locating…" : "Use my current location"}
        </Button>

        {/* search a place */}
        <Card pad={14}>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Input placeholder="Search a village, town or district" value={query}
                icon="Search" onChange={setQuery} />
            </div>
            <Button variant="soft" icon="Search" onClick={runSearch}>Find</Button>
          </div>
          {searching && <div style={{ padding: "14px 0", display: "grid", placeItems: "center" }}><Spinner /></div>}
          {results.map((r, i) => (
            <button key={i} onClick={() => addPlace(r)}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", background: "none",
                border: "none", borderTop: `1px solid ${T.lineSoft}`, padding: "11px 2px", cursor: "pointer", color: T.ink }}>
              <Icon name="MapPin" size={16} style={{ color: T.primary, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13.5 }}>{r.label}</span>
              <Icon name="Plus" size={16} style={{ color: T.inkFaint }} />
            </button>
          ))}
        </Card>

        {/* saved farms */}
        {farms.length === 0 ? (
          <EmptyState icon="MapPin" title="No saved locations"
            body="Add your farm by GPS or by searching a place above." />
        ) : (
          farms.map((f) => {
            const isActive = f.id === active;
            return (
              <Card key={f.id} pad={0} style={{ overflow: "hidden", borderColor: isActive ? T.primary : T.line }}>
                <MapView lat={f.lat} lon={f.lon} height={130} />
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                    <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>{f.lat.toFixed(3)}, {f.lon.toFixed(3)}</div>
                  </div>
                  {isActive ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: T.primary, background: T.primarySoft, padding: "5px 10px", borderRadius: 999 }}>
                      <Icon name="Check" size={13} /> Active
                    </span>
                  ) : (
                    <button onClick={() => makeActive(f.id)}
                      style={{ fontSize: 12.5, fontWeight: 600, color: T.primary, background: "none", border: `1px solid ${T.line}`, borderRadius: 999, padding: "5px 12px", cursor: "pointer" }}>
                      Set active
                    </button>
                  )}
                  <button onClick={() => setConfirmDel(f)} aria-label="Delete"
                    style={{ background: "none", border: "none", cursor: "pointer", color: T.inkFaint, display: "flex", padding: 4 }}>
                    <Icon name="Trash2" size={17} />
                  </button>
                </div>
              </Card>
            );
          })
        )}
      </Screen>

      <Dialog open={!!confirmDel} onClose={() => setConfirmDel(null)}
        title="Remove location?"
        body={`"${confirmDel?.name}" will be removed from this device.`}
        confirmLabel="Remove" cancelLabel="Cancel" danger onConfirm={doDelete} />
    </>
  );
}
