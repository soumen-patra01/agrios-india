import { useCallback, useEffect, useState } from "react";
import { T } from "../theme/ThemeProvider.jsx";
import Icon from "../components/Icon.jsx";
import { AppBar, Screen, Card, Spinner, EmptyState, ErrorState, Button } from "../components/index.js";
import { LineChart } from "../components/chart.jsx";
import { useApp } from "../store/AppStore.jsx";
import { weatherService } from "../services/weather/weatherService.js";
import { locationService } from "../services/location/locationService.js";

const SEV = {
  danger: { bg: T.redSoft, fg: T.red },
  warn: { bg: T.orangeSoft, fg: T.orange },
  good: { bg: T.primarySoft, fg: T.primary },
  info: { bg: T.blueSoft, fg: T.blue },
};

const hourLabel = (t, locale) =>
  new Date(t).toLocaleTimeString(locale, { hour: "numeric", hour12: true }).replace(" ", "");
const dayLabel = (t, locale, i, tc) =>
  i === 0 ? tc({en:"Today",hi:"आज",bn:"আজ"}) : new Date(t).toLocaleDateString(locale, { weekday: "short" });

export default function WeatherDashboard() {
  const { pop, push, locale, toast, tc } = useApp();
  const [loc, setLoc] = useState(() => locationService.getActive());
  const [state, setState] = useState({ status: "idle", data: null, alerts: [], stale: false });
  const [gpsBusy, setGpsBusy] = useState(false);

  const load = useCallback(async (location, force = false) => {
    if (!location) { setState({ status: "empty" }); return; }
    setState((s) => ({ ...s, status: "loading" }));
    try {
      const { weather, alerts, stale } = await weatherService.get({ lat: location.lat, lon: location.lon, force });
      setState({ status: "ready", data: weather, alerts, stale });
    } catch {
      setState({ status: "error" });
    }
  }, []);

  useEffect(() => { load(loc); }, [loc, load]);

  const useGPS = async () => {
    setGpsBusy(true);
    try {
      const pos = await locationService.currentPosition();
      const farm = locationService.add({ name: pos.name, lat: pos.lat, lon: pos.lon });
      setLoc(farm);
      toast(tc({en:"Location set",hi:"स्थान सेट हो गया",bn:"অবস্থান সেট হয়েছে"}), "success");
    } catch (e) {
      toast(e.message || tc({en:"Couldn't get your location",hi:"आपका स्थान नहीं मिल सका",bn:"আপনার অবস্থান পাওয়া যায়নি"}), "error");
    } finally {
      setGpsBusy(false);
    }
  };

  const { status, data, alerts, stale } = state;

  return (
    <>
      <AppBar
        title={tc({en:"Weather",hi:"मौसम",bn:"আবহাওয়া"})}
        onBack={pop}
        action={
          <button onClick={() => load(loc, true)} aria-label="Refresh"
            disabled={status === "loading"}
            style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 12, padding: 8, cursor: "pointer", color: T.ink, display: "flex", opacity: status === "loading" ? 0.5 : 1 }}>
            <Icon name="RefreshCw" size={18} />
          </button>
        }
      />
      <Screen gap={16}>
        {/* location switcher */}
        <button onClick={() => push({ kind: "farmLocations" })}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: T.ink, padding: "0 2px" }}>
          <Icon name="MapPin" size={16} style={{ color: T.primary }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>{loc?.name || tc({en:"No location set",hi:"कोई स्थान सेट नहीं",bn:"কোনো অবস্থান সেট নেই"})}</span>
          <Icon name="ChevronDown" size={15} style={{ color: T.inkFaint }} />
        </button>

        {status === "loading" && !data && (
          <div style={{ display: "grid", placeItems: "center", padding: "48px 0" }}><Spinner size={28} /></div>
        )}

        {status === "empty" && (
          <EmptyState icon="MapPin" title={tc({en:"Set your location",hi:"अपना स्थान सेट करें",bn:"আপনার অবস্থান সেট করুন"})}
            body={tc({en:"Weather and alerts are tailored to your farm. Use GPS or pick a place.",hi:"मौसम और अलर्ट आपके खेत के अनुसार हैं। GPS या स्थान चुनें।",bn:"আবহাওয়া ও সতর্কতা আপনার খামারের জন্য। GPS বা স্থান বেছে নিন।"})}
            action={gpsBusy ? tc({en:"Locating…",hi:"खोज रहा है…",bn:"খুঁজছে…"}) : tc({en:"Use my location",hi:"मेरा स्थान उपयोग करें",bn:"আমার অবস্থান ব্যবহার করুন"})} onAction={useGPS} />
        )}

        {status === "error" && (
          <ErrorState title={tc({en:"Couldn't load weather",hi:"मौसम लोड नहीं हो सका",bn:"আবহাওয়া লোড হয়নি"})} body={tc({en:"Check your connection and try again.",hi:"अपना कनेक्शन जाँचें और पुनः प्रयास करें।",bn:"আপনার সংযোগ পরীক্ষা করুন ও আবার চেষ্টা করুন।"})} onRetry={() => load(loc, true)} />
        )}

        {data && (
          <>
            {stale && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: T.inkSoft, padding: "0 2px" }}>
                <Icon name="CloudOff" size={14} /> {tc({en:"Showing last saved forecast (offline).",hi:"अंतिम सहेजा गया पूर्वानुमान दिखा रहा है (ऑफ़लाइन)।",bn:"শেষ সংরক্ষিত পূর্বাভাস দেখাচ্ছে (অফলাইন)।"})}
              </div>
            )}

            {/* current conditions hero */}
            <CurrentHero cur={data.current} locName={loc?.name} tc={tc} />

            {/* alerts */}
            {alerts.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {alerts.map((a) => {
                  const c = SEV[a.severity] || SEV.info;
                  return (
                    <div key={a.id} style={{ display: "flex", gap: 12, padding: 14, borderRadius: T.rLg, background: c.bg }}>
                      <div style={{ color: c.fg, flexShrink: 0, marginTop: 1 }}><Icon name={a.icon} size={20} /></div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: c.fg }}>{a.title}</div>
                        <div style={{ fontSize: 13, color: T.ink, marginTop: 2, lineHeight: 1.45 }}>{a.body}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* hourly */}
            {data.hourly?.length > 0 && (
              <Card pad={14}>
                <SectionLabel icon="Clock" text={tc({en:"Next 24 hours",hi:"अगले 24 घंटे",bn:"পরবর্তী ২৪ ঘণ্টা"})} />
                <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 4, marginTop: 6 }}>
                  {data.hourly.filter((_, i) => i % 2 === 0).map((h, i) => (
                    <div key={i} style={{ display: "grid", justifyItems: "center", gap: 5, minWidth: 44 }}>
                      <span style={{ fontSize: 11.5, color: T.inkSoft }}>{hourLabel(h.time, locale)}</span>
                      <Icon name={h.icon} size={20} style={{ color: T.blue }} />
                      <span style={{ fontSize: 13.5, fontWeight: 700 }}>{h.temp}°</span>
                      {h.precipProb != null && (
                        <span style={{ fontSize: 10.5, color: T.blue, display: "flex", alignItems: "center", gap: 2 }}>
                          <Icon name="Droplets" size={10} />{h.precipProb}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 6 }}>
                  <LineChart data={data.hourly.map((h) => ({ value: h.temp }))} color={T.orange} unit="°" height={90} />
                </div>
              </Card>
            )}

            {/* 7-day */}
            {data.daily?.length > 0 && (
              <Card pad={6}>
                <div style={{ padding: "10px 12px 4px" }}><SectionLabel icon="CalendarDays" text={tc({en:"7-day forecast",hi:"7-दिन का पूर्वानुमान",bn:"৭-দিনের পূর্বাভাস"})} /></div>
                {data.daily.map((d, i) => (
                  <div key={d.date} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderTop: i ? `1px solid ${T.lineSoft}` : "none" }}>
                    <span style={{ width: 46, fontSize: 13, fontWeight: 600, color: T.ink }}>{dayLabel(d.date, locale, i, tc)}</span>
                    <Icon name={d.icon} size={19} style={{ color: T.blue, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 11.5, color: T.blue, display: "flex", alignItems: "center", gap: 3 }}>
                      <Icon name="Droplets" size={11} />{d.precipProb ?? 0}%
                    </span>
                    <span style={{ fontSize: 13.5, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{d.tempMax}°</span>
                    <span style={{ fontSize: 13, color: T.inkFaint, fontVariantNumeric: "tabular-nums", width: 30, textAlign: "right" }}>{d.tempMin}°</span>
                  </div>
                ))}
              </Card>
            )}

            <Button variant="soft" icon="Compass" full onClick={() => push({ kind: "nearby" })}>
              {tc({en:"Find services near me",hi:"मेरे पास सेवाएँ खोजें",bn:"আমার কাছে পরিষেবা খুঁজুন"})}
            </Button>

            <div style={{ fontSize: 11.5, color: T.inkFaint, textAlign: "center", lineHeight: 1.5 }}>
              {tc({en:"Forecast from Open-Meteo · updated",hi:"Open-Meteo से पूर्वानुमान · अपडेट",bn:"Open-Meteo থেকে পূর্বাভাস · আপডেট"})} {new Date(data.updatedAt).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })}
            </div>
          </>
        )}
      </Screen>
    </>
  );
}

function CurrentHero({ cur, locName, tc }) {
  return (
    <div style={{ borderRadius: T.rLg, padding: 20, color: "#fff", position: "relative", overflow: "hidden",
      background: cur.isDay ? "linear-gradient(135deg, #2C6E9E, #1E5178)" : "linear-gradient(135deg, #2A3550, #171E30)", boxShadow: T.shadowMd }}>
      <div style={{ position: "absolute", right: -16, top: -16, opacity: 0.18 }}><Icon name={cur.icon} size={128} /></div>
      <div style={{ position: "relative" }}>
        <div style={{ fontSize: 12.5, opacity: 0.9, fontWeight: 600 }}>{locName}</div>
        <div style={{ fontFamily: T.display, fontSize: 52, fontWeight: 800, lineHeight: 1.05, marginTop: 4 }}>{cur.temp}°</div>
        <div style={{ fontSize: 14, opacity: 0.95 }}>{cur.condition} · {tc({en:`feels ${cur.feelsLike}°`,hi:`अनुभव ${cur.feelsLike}°`,bn:`অনুভূত ${cur.feelsLike}°`})}</div>
        <div style={{ display: "flex", gap: 16, marginTop: 14, fontSize: 12.5, opacity: 0.95, flexWrap: "wrap" }}>
          <span><Icon name="Droplets" size={13} style={{ verticalAlign: -2 }} /> {tc({en:`${cur.humidity}% humidity`,hi:`${cur.humidity}% आर्द्रता`,bn:`${cur.humidity}% আর্দ্রতা`})}</span>
          <span><Icon name="Wind" size={13} style={{ verticalAlign: -2 }} /> {tc({en:`${cur.windSpeed} km/h`,hi:`${cur.windSpeed} किमी/घंटा`,bn:`${cur.windSpeed} কিমি/ঘণ্টা`})}</span>
          {cur.pressure && <span><Icon name="Gauge" size={13} style={{ verticalAlign: -2 }} /> {cur.pressure} hPa</span>}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ icon, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, color: T.inkSoft }}>
      <Icon name={icon} size={15} />
      <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{text}</span>
    </div>
  );
}
