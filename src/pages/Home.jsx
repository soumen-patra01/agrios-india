import { useEffect, useState } from "react";
import { T } from "../theme/ThemeProvider.jsx";
import Icon from "../components/Icon.jsx";
import { Card, IconTile, SectionHeader, Chip } from "../components/index.js";
import { useApp } from "../store/AppStore.jsx";
import { greetingKey, longDate, initials, rupee, compact } from "../utils/format.js";
import { weatherService } from "../services/weather/weatherService.js";
import { locationService } from "../services/location/locationService.js";
import { ledgerService } from "../services/ledger/ledgerService.js";
import { notificationService } from "../services/notifications/notificationService.js";
import {
  QUICK_ACTIONS, TASKS, SCHEMES, PRICES, NEWS, CALCULATORS, CATEGORIES, FEATURED, AI_TOOLS,
} from "../constants/content.js";
import { accent } from "../components/primitives.jsx";

const H_PAD = 16;

export default function Home() {
  const { t, locale, user, push, switchTab } = useApp();
  const [tasks, setTasks] = useState(TASKS);
  const name = (user?.name || "Farmer").split(" ")[0];

  const openFeature = (title, desc, icon, a) => push({ kind: "feature", props: { title, desc, icon, a } });
  const openAI = (id) => {
    const x = AI_TOOLS.find((k) => k.id === id);
    push({ kind: "chat", props: { agentId: x?.agentId ?? null } });
  };

  const { net: monthNet, income: monthIn, expense: monthOut } = ledgerService.currentMonthSummary();

  const [showNotifBanner, setShowNotifBanner] = useState(
    () => notificationService.isSupported() && !notificationService.hasPrompted()
  );

  const handleNotifAllow = async () => {
    const result = await notificationService.requestPermission();
    setShowNotifBanner(false);
    if (result === "granted") toast("Weather alerts enabled", "success");
    else toast("Notifications blocked — enable in browser settings", "info");
  };

  const handleNotifDismiss = () => {
    notificationService.markPrompted();
    setShowNotifBanner(false);
  };

  return (
    <div style={{ paddingBottom: 24, animation: "ag-fade .25s var(--ag-ease)" }}>
      {/* greeting */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: `18px ${H_PAD}px 8px` }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(150deg, ${T.primary}, ${T.primaryDark})`, color: "#fff", display: "grid", placeItems: "center", fontFamily: T.display, fontWeight: 700, fontSize: 17 }}>
          {initials(user?.name || "Farmer")}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, color: T.inkSoft }}>{longDate(locale)}</div>
          <div style={{ fontFamily: T.display, fontSize: 20, fontWeight: 700, color: T.ink }}>{t(greetingKey())}, {name}</div>
        </div>
        <button onClick={() => openFeature("Notifications", "Alerts, reminders and advisories.", "Bell", "orange")}
          style={{ position: "relative", background: T.surface, border: `1px solid ${T.line}`, borderRadius: 13, padding: 9, cursor: "pointer", color: T.ink, display: "flex" }}>
          <Icon name="Bell" size={20} />
          <span style={{ position: "absolute", top: 8, right: 9, width: 7, height: 7, borderRadius: "50%", background: T.red, border: `2px solid ${T.surface}` }} />
        </button>
      </div>

      {/* weather */}
      <div style={{ padding: `6px ${H_PAD}px 0` }}>
        <WeatherCard t={t} onOpen={() => push({ kind: "weather" })} />
      </div>

      {/* notification opt-in banner — shown once */}
      {showNotifBanner && (
        <div style={{ padding: `10px ${H_PAD}px 0` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
            borderRadius: T.rLg, background: T.primarySoft, border: `1px solid ${T.primary}22` }}>
            <Icon name="BellRing" size={20} style={{ color: T.primary, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.primary }}>Enable weather alerts?</div>
              <div style={{ fontSize: 12, color: T.inkSoft }}>Get notified of storms and spray windows.</div>
            </div>
            <button onClick={handleNotifAllow}
              style={{ background: T.primary, color: "#fff", border: "none", borderRadius: 10,
                padding: "7px 12px", cursor: "pointer", fontFamily: T.body, fontSize: 12.5, fontWeight: 600, flexShrink: 0 }}>
              Allow
            </button>
            <button onClick={handleNotifDismiss}
              style={{ background: "none", border: "none", cursor: "pointer", color: T.inkFaint, display: "flex", padding: 4, flexShrink: 0 }}>
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>
      )}

      {/* farm summary */}
      <div style={{ padding: `18px ${H_PAD}px 0` }}>
        <SectionHeader title={t("farmSummary")} action={t("seeAll")} onAction={() => push({ kind: "farmLedger" })} />
        <div style={{ display: "flex", gap: 10 }}>
          <StatTile label={t("net")} value={compact(monthNet)} accentColor={T.primary} icon="TrendingUp" bg={T.primarySoft} />
          <StatTile label={t("income")} value={compact(monthIn)} accentColor={T.blue} icon="ArrowDownLeft" bg={T.blueSoft} />
          <StatTile label={t("expense")} value={compact(monthOut)} accentColor={T.orange} icon="ArrowUpRight" bg={T.orangeSoft} />
        </div>
      </div>

      {/* AI quick actions */}
      <div style={{ padding: `20px ${H_PAD}px 0` }}>
        <SectionHeader title={t("aiQuick")} action={t("seeAll")} onAction={() => switchTab("ai")} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {QUICK_ACTIONS.map((q) => (
            <button key={q.id} onClick={() => openAI(q.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "grid", justifyItems: "center", gap: 7, padding: 0 }}>
              <IconTile name={q.icon} a={q.accent} size={54} iconSize={24} />
              <span style={{ fontSize: 11.5, fontWeight: 600, color: T.inkSoft, textAlign: "center" }}>{q.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* tasks */}
      <div style={{ padding: `20px ${H_PAD}px 0` }}>
        <SectionHeader title={t("todayTasks")} />
        <Card pad={6}>
          {tasks.map((tk, i) => (
            <div key={tk.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderTop: i ? `1px solid ${T.lineSoft}` : "none" }}>
              <button onClick={() => setTasks(tasks.map((x) => x.id === tk.id ? { ...x, done: !x.done } : x))} aria-label="toggle"
                style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, cursor: "pointer", display: "grid", placeItems: "center",
                  border: `1.5px solid ${tk.done ? T.primary : T.line}`, background: tk.done ? T.primary : "transparent", transition: "all .15s" }}>
                {tk.done && <Icon name="Check" size={14} color="#fff" strokeWidth={3} />}
              </button>
              <span style={{ flex: 1, fontSize: 14, color: tk.done ? T.inkFaint : T.ink, textDecoration: tk.done ? "line-through" : "none" }}>{tk.text}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.inkSoft, background: T.surface2, padding: "3px 9px", borderRadius: 8 }}>{tk.tag}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* schemes — horizontal */}
      <div style={{ paddingTop: 20 }}>
        <div style={{ padding: `0 ${H_PAD}px` }}><SectionHeader title={t("schemes")} action={t("seeAll")} onAction={() => push({ kind: "schemeExplorer" })} /></div>
        <HScroll>
          {SCHEMES.map((s) => {
            const c = accent(s.accent);
            return (
              <div key={s.id} onClick={() => push({ kind: "schemeExplorer" })}
                style={{ minWidth: 210, background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.rLg, padding: 15, cursor: "pointer" }}>
                <div style={{ display: "inline-flex", fontSize: 11, fontWeight: 700, color: c.fg, background: c.bg, padding: "4px 9px", borderRadius: 7 }}>{s.tag}</div>
                <div style={{ fontFamily: T.display, fontSize: 16, fontWeight: 700, marginTop: 10 }}>{s.title}</div>
                <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 3 }}>{s.note}</div>
              </div>
            );
          })}
        </HScroll>
      </div>

      {/* prices */}
      <div style={{ padding: `20px ${H_PAD}px 0` }}>
        <SectionHeader title={t("prices")} action={t("seeAll")} onAction={() => switchTab("market")} />
        <Card pad={6}>
          {PRICES.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderTop: i ? `1px solid ${T.lineSoft}` : "none" }}>
              <IconTile name={p.crop === "Milk" ? "Milk" : "Wheat"} a="primary" size={38} iconSize={18} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{p.crop}</div>
                <div style={{ fontSize: 12, color: T.inkSoft }}>{p.mandi}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{rupee(p.price)}<span style={{ fontSize: 11, color: T.inkFaint, fontWeight: 500 }}>/{p.unit}</span></div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: p.up ? T.primary : T.red, display: "flex", alignItems: "center", gap: 2, justifyContent: "flex-end" }}>
                  <Icon name={p.up ? "TrendingUp" : "TrendingDown"} size={12} /> {p.change}%
                </div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* disease detection banner */}
      <div style={{ padding: `20px ${H_PAD}px 0` }}>
        <div onClick={() => openAI("doctor")}
          style={{ display: "flex", alignItems: "center", gap: 14, borderRadius: T.rLg, padding: 16, cursor: "pointer",
            background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`, color: "#fff", boxShadow: T.shadowMd }}>
          <div style={{ width: 50, height: 50, borderRadius: 16, background: "rgba(255,255,255,.18)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="ScanLine" size={26} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.display, fontSize: 16, fontWeight: 700 }}>{t("disease")}</div>
            <div style={{ fontSize: 12.5, opacity: .9, marginTop: 2 }}>Snap a photo, get an instant diagnosis.</div>
          </div>
          <Icon name="Camera" size={22} />
        </div>
      </div>

      {/* calculators */}
      <div style={{ padding: `20px ${H_PAD}px 0` }}>
        <SectionHeader title={t("calculators")} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {CALCULATORS.map((c) => (
            <button key={c.id} onClick={() => openFeature(c.title + " calculator", "Quick on-device calculation.", c.icon, c.accent)}
              style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.rLg, padding: "14px 10px", cursor: "pointer", display: "grid", justifyItems: "center", gap: 8 }}>
              <IconTile name={c.icon} a={c.accent} size={42} iconSize={20} />
              <span style={{ fontSize: 12, fontWeight: 600, color: T.ink }}>{c.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* categories */}
      <div style={{ padding: `20px ${H_PAD}px 0` }}>
        <SectionHeader title={t("categories")} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => openFeature(c.title, "Everything for " + c.title.toLowerCase() + ".", c.icon, c.accent)}
              style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.rLg, padding: "16px 10px", cursor: "pointer", display: "grid", justifyItems: "center", gap: 8 }}>
              <IconTile name={c.icon} a={c.accent} size={46} iconSize={22} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: T.ink }}>{c.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* featured services */}
      <div style={{ paddingTop: 20 }}>
        <div style={{ padding: `0 ${H_PAD}px` }}><SectionHeader title={t("featured")} action={t("seeAll")} onAction={() => switchTab("services")} /></div>
        <HScroll>
          {FEATURED.map((s) => {
            const c = accent(s.accent);
            return (
              <div key={s.id} onClick={() => openFeature(s.title, s.desc, s.icon, s.accent)}
                style={{ minWidth: 190, background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.rLg, padding: 15, cursor: "pointer" }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: c.bg, color: c.fg, display: "grid", placeItems: "center", marginBottom: 12 }}>
                  <Icon name={s.icon} size={22} />
                </div>
                <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 700 }}>{s.title}</div>
                <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>{s.desc}</div>
              </div>
            );
          })}
        </HScroll>
      </div>

      {/* news */}
      <div style={{ padding: `20px ${H_PAD}px 0` }}>
        <SectionHeader title={t("news")} />
        <Card pad={6}>
          {NEWS.map((n, i) => (
            <div key={n.id} onClick={() => openFeature(n.tag, n.title, "Newspaper", "blue")}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", cursor: "pointer", borderTop: i ? `1px solid ${T.lineSoft}` : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.primary, marginBottom: 3 }}>{n.tag} · {n.time}</div>
                <div style={{ fontSize: 13.5, color: T.ink, lineHeight: 1.4 }}>{n.title}</div>
              </div>
              <Icon name="ChevronRight" size={18} style={{ color: T.inkFaint, flexShrink: 0 }} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

/* Live weather summary — real data via weatherService, tuned to the farmer's
   active location. Falls back gracefully when no location is set or offline. */
function WeatherCard({ t, onOpen }) {
  const [loc] = useState(() => locationService.getActive());
  const [st, setSt] = useState({ status: loc ? "loading" : "empty", data: null, alert: null });

  useEffect(() => {
    if (!loc) return;
    let alive = true;
    weatherService.get({ lat: loc.lat, lon: loc.lon })
      .then(({ weather, alerts }) => { if (alive) setSt({ status: "ready", data: weather, alert: alerts[0] || null }); })
      .catch(() => { if (alive) setSt({ status: "error", data: null, alert: null }); });
    return () => { alive = false; };
  }, [loc]);

  const grad = "linear-gradient(135deg, #2C6E9E, #1E5178)";

  // No location yet — invite the farmer to set one.
  if (st.status === "empty") {
    return (
      <div onClick={onOpen} style={{ borderRadius: T.rLg, padding: 18, cursor: "pointer", color: "#fff", position: "relative", overflow: "hidden", background: grad, boxShadow: T.shadowMd }}>
        <div style={{ position: "absolute", right: -18, top: -18, opacity: .18 }}><Icon name="CloudSun" size={130} /></div>
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
          <Icon name="MapPin" size={24} />
          <div>
            <div style={{ fontFamily: T.display, fontSize: 16, fontWeight: 700 }}>{t("weather")}</div>
            <div style={{ fontSize: 12.5, opacity: .92, marginTop: 2 }}>Set your location for a live forecast →</div>
          </div>
        </div>
      </div>
    );
  }

  if (st.status === "loading") {
    return <div style={{ borderRadius: T.rLg, height: 132, background: grad, boxShadow: T.shadowMd, opacity: .55 }} />;
  }

  if (st.status === "error") {
    return (
      <div onClick={onOpen} style={{ borderRadius: T.rLg, padding: 18, cursor: "pointer", color: "#fff", background: grad, boxShadow: T.shadowMd, display: "flex", alignItems: "center", gap: 10 }}>
        <Icon name="CloudOff" size={22} />
        <span style={{ fontSize: 13.5 }}>Weather unavailable — tap to retry</span>
      </div>
    );
  }

  const c = st.data.current;
  return (
    <div onClick={onOpen} style={{ borderRadius: T.rLg, padding: 18, cursor: "pointer", color: "#fff", position: "relative", overflow: "hidden", background: grad, boxShadow: T.shadowMd }}>
      <div style={{ position: "absolute", right: -18, top: -18, opacity: .18 }}><Icon name={c.icon} size={130} /></div>
      <div style={{ display: "flex", alignItems: "flex-start", position: "relative" }}>
        <div>
          <div style={{ fontSize: 12.5, opacity: .9, fontWeight: 600 }}>{t("weather")} · {loc.name}</div>
          <div style={{ fontFamily: T.display, fontSize: 40, fontWeight: 800, lineHeight: 1.1, marginTop: 2 }}>{c.temp}°</div>
          <div style={{ fontSize: 13, opacity: .92 }}>{c.condition} · feels {c.feelsLike}°</div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right", fontSize: 12, opacity: .92, lineHeight: 1.8 }}>
          <div><Icon name="Droplets" size={12} style={{ verticalAlign: -1 }} /> {c.humidity}%</div>
          <div><Icon name="Wind" size={12} style={{ verticalAlign: -1 }} /> {c.windSpeed} km/h</div>
        </div>
      </div>
      {st.alert && (
        <div style={{ display: "flex", gap: 8, marginTop: 14, padding: "9px 12px", borderRadius: 12, background: "rgba(255,255,255,.16)", fontSize: 12.5, position: "relative" }}>
          <Icon name={st.alert.icon} size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{st.alert.title} — {st.alert.body}</span>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, accentColor, icon, bg }) {
  return (
    <div style={{ flex: 1, background: T.surface, border: `1px solid ${T.line}`, borderRadius: T.rLg, padding: "13px 12px" }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, background: bg, color: accentColor, display: "grid", placeItems: "center", marginBottom: 9 }}>
        <Icon name={icon} size={16} strokeWidth={2.4} />
      </div>
      <div style={{ fontSize: 11.5, color: T.inkSoft }}>{label}</div>
      <div style={{ fontFamily: T.display, fontSize: 17, fontWeight: 700, color: T.ink, marginTop: 1 }}>{value}</div>
    </div>
  );
}

function HScroll({ children }) {
  return (
    <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: `0 ${H_PAD}px 4px`, scrollSnapType: "x proximity" }}>
      {children}
    </div>
  );
}
