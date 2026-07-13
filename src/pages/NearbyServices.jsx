import { useCallback, useEffect, useState } from "react";
import { T } from "../theme/ThemeProvider.jsx";
import Icon from "../components/Icon.jsx";
import { AppBar, Screen, Card, Chip, Spinner, EmptyState, ErrorState, IconTile } from "../components/index.js";
import { useApp } from "../store/AppStore.jsx";
import { locationService } from "../services/location/locationService.js";
import { nearbyService, NEARBY_CATEGORIES, getCategory } from "../services/nearby/nearbyService.js";
import { mapsService } from "../services/maps/mapsService.js";

export default function NearbyServices() {
  const { pop, push } = useApp();
  const [loc] = useState(() => locationService.getActive());
  const [cat, setCat] = useState(NEARBY_CATEGORIES[0].id);
  const [state, setState] = useState({ status: "idle", items: [] });

  const load = useCallback(async (categoryId) => {
    if (!loc) { setState({ status: "empty", items: [] }); return; }
    setState({ status: "loading", items: [] });
    try {
      const items = await nearbyService.find({ categoryId, lat: loc.lat, lon: loc.lon });
      setState({ status: "ready", items });
    } catch {
      setState({ status: "error", items: [] });
    }
  }, [loc]);

  useEffect(() => { load(cat); }, [cat, load]);

  const category = getCategory(cat);
  const { status, items } = state;

  return (
    <>
      <AppBar title="Nearby services" onBack={pop} />
      <Screen gap={14}>
        {!loc ? (
          <EmptyState icon="MapPin" title="Set your location first"
            body="We need your farm location to find services near you."
            action="Set location" onAction={() => push({ kind: "farmLocations" })} />
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.inkSoft, fontSize: 12.5, padding: "0 2px" }}>
              <Icon name="MapPin" size={14} style={{ color: T.primary }} /> Around {loc.name}
            </div>

            {/* category chips */}
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              {NEARBY_CATEGORIES.map((c) => (
                <Chip key={c.id} active={c.id === cat} icon={c.icon} onClick={() => setCat(c.id)}>{c.label}</Chip>
              ))}
            </div>

            {status === "loading" && (
              <div style={{ display: "grid", placeItems: "center", padding: "40px 0" }}><Spinner size={26} /></div>
            )}
            {status === "error" && (
              <ErrorState title="Couldn't load services" body="Check your connection and try again." onRetry={() => load(cat)} />
            )}
            {status === "ready" && items.length === 0 && (
              <EmptyState icon="SearchX" title={`No ${category.label.toLowerCase()} found nearby`}
                body="Nothing within 15 km on the map. Try another category." />
            )}

            {status === "ready" && items.map((p) => (
              <Card key={p.id} pad={13} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <IconTile name={category.icon} a={category.accent} size={44} iconSize={21} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>
                    {p.distanceKm} km away{p.address ? ` · ${p.address}` : ""}
                  </div>
                </div>
                <a href={mapsService.directionsUrl({ lat: p.lat, lon: p.lon })} target="_blank" rel="noreferrer"
                  aria-label="Directions"
                  style={{ background: T.primarySoft, color: T.primary, borderRadius: 12, padding: 9, display: "flex", flexShrink: 0 }}>
                  <Icon name="Navigation" size={18} />
                </a>
              </Card>
            ))}

            {status === "ready" && items.length > 0 && (
              <div style={{ fontSize: 11.5, color: T.inkFaint, textAlign: "center", lineHeight: 1.5 }}>
                Places from OpenStreetMap · distances are straight-line
              </div>
            )}
          </>
        )}
      </Screen>
    </>
  );
}
