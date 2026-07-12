import { useState, useEffect, useMemo, useRef, createContext, useContext } from "react";
import {
  Droplets, Wind, CloudRain, Sun, Sprout, Plus, Minus, Trash2, X,
  TrendingUp, TrendingDown, Check, ChevronLeft, ChevronRight, Wallet,
  Bot, User, AlertTriangle, Home as HomeIcon, NotebookPen, Send, KeyRound,
} from "lucide-react";
import { LANGS, LOCALES, makeT } from "./i18n.js";
import {
  ENTERPRISES, CATS, ACTIVITIES, STATES, catMeta, entMeta, actMeta,
  fmt, todayISO, prettyDate, longToday, K, loadKey, saveKey, sampleTx,
} from "./domain.js";
import { getWeather, buildAdvisory } from "./weather.js";
import { buildSystem, askAdvisor, DEFAULT_MODEL } from "./advisor.js";

/* ---------------- theme ---------------- */
const C = {
  bg: "#F5F7F1", surface: "#FFFFFF", ink: "#1B2A20", inkSoft: "#6A7A6D",
  line: "#E4E8DD", brand: "#1E5631", income: "#2E7D32", incomeSoft: "#E8F3E8",
  expense: "#B23A2E", expenseSoft: "#F8EAE7", sky: "#2C5F7C", skySoft: "#E7F0F5",
  warn: "#B8860B", warnSoft: "#FBF3DF",
};
const DISPLAY = "'Fraunces','Noto Sans Devanagari','Noto Sans Bengali',Georgia,serif";
const BODY = "'Inter','Noto Sans Devanagari','Noto Sans Bengali',system-ui,sans-serif";

const I18n = createContext({ t: makeT("en"), lang: "en", locale: "en-IN" });
const useI18n = () => useContext(I18n);

const greetKey = () => { const h = new Date().getHours(); return h < 12 ? "gm" : h < 17 ? "ga" : "ge"; };

/* ================= root ================= */
export default function AgriOS() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState(null);
  const [tx, setTx] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [diary, setDiary] = useState([]);
  const [settings, setSettings] = useState({});
  const [weather, setWeather] = useState(null);
  const [tab, setTab] = useState("home");
  const [sheet, setSheet] = useState(null);

  useEffect(() => {
    Promise.all([
      loadKey(K.profile, null), loadKey(K.tx, []), loadKey(K.tasks, []),
      loadKey(K.diary, []), loadKey(K.settings, {}),
    ]).then(([p, t, k, d, s]) => {
      setProfile(p); setTx(t || []); setTasks(k || []); setDiary(d || []); setSettings(s || {});
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (profile?.state) getWeather(profile.state).then(setWeather);
  }, [profile?.state]);

  const putTx = (n) => { setTx(n); saveKey(K.tx, n); };
  const putTasks = (n) => { setTasks(n); saveKey(K.tasks, n); };
  const putDiary = (n) => { setDiary(n); saveKey(K.diary, n); };
  const putProfile = (p) => { setProfile(p); saveKey(K.profile, p); };
  const putSettings = (s) => { setSettings(s); saveKey(K.settings, s); };

  const lang = profile?.lang || "en";
  const ctx = useMemo(() => ({ t: makeT(lang), lang, locale: LOCALES[lang] }), [lang]);

  if (!ready) return <Shell><div style={{ padding: 60, textAlign: "center", color: C.inkSoft }}>Loading AgriOS…</div></Shell>;
  if (!profile) return <Shell><Onboarding onDone={putProfile} /></Shell>;

  return (
    <I18n.Provider value={ctx}>
      <Shell>
        <div style={{ paddingBottom: 96 }}>
          {tab === "home" && <HomeScreen profile={profile} tx={tx} tasks={tasks} putTasks={putTasks} weather={weather}
            onAdd={setSheet} onSeed={() => putTx([...sampleTx(), ...tx])} goBusiness={() => setTab("business")} />}
          {tab === "diary" && <DiaryScreen profile={profile} diary={diary} putDiary={putDiary} />}
          {tab === "business" && <Business profile={profile} tx={tx} putTx={putTx} onAdd={setSheet} onSeed={() => putTx([...sampleTx(), ...tx])} />}
          {tab === "advisor" && <AdvisorScreen profile={profile} tx={tx} diary={diary} tasks={tasks} weather={weather}
            settings={settings} putSettings={putSettings} />}
          {tab === "profile" && <ProfileScreen profile={profile} onSave={putProfile} />}
        </div>

        <Nav tab={tab} setTab={setTab} />
        {sheet && <AddSheet type={sheet} farms={profile.enterprises} onClose={() => setSheet(null)}
          onSave={(e) => { putTx([e, ...tx]); setSheet(null); }} />}
      </Shell>
    </I18n.Provider>
  );
}

function Shell({ children }) {
  return (
    <div style={{ background: C.bg, color: C.ink, fontFamily: BODY, minHeight: "100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap');
        *{-webkit-tap-highlight-color:transparent;box-sizing:border-box}
        input:focus,button:focus-visible{outline:2px solid ${C.brand};outline-offset:2px}
        @keyframes rise{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
      <div style={{ maxWidth: 460, margin: "0 auto", position: "relative" }}>{children}</div>
    </div>
  );
}

/* ================= onboarding ================= */
function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [d, setD] = useState({ name: "", state: "West Bengal", acres: "", enterprises: [], lang: "en" });
  const t = useMemo(() => makeT(d.lang), [d.lang]);
  const toggle = (k) => setD({ ...d, enterprises: d.enterprises.includes(k) ? d.enterprises.filter(x => x !== k) : [...d.enterprises, k] });
  const canNext = step === 0 ? d.name.trim().length > 1 : d.enterprises.length > 0;

  return (
    <div style={{ padding: "48px 22px" }}>
      <div style={{ width: 46, height: 46, borderRadius: 14, background: C.brand, display: "grid", placeItems: "center", marginBottom: 18 }}>
        <Sprout size={26} color="#fff" strokeWidth={2.3} />
      </div>
      {step === 0 ? (
        <>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 30, fontWeight: 600, margin: "0 0 8px", lineHeight: 1.15 }}>
            {t("obTitle1")} <span style={{ color: C.brand }}>{t("obTitle2")}</span>
          </h1>
          <p style={{ fontSize: 14.5, color: C.inkSoft, lineHeight: 1.55, margin: "0 0 22px" }}>{t("obSub")}</p>
          <Field label={t("langLabel")}>
            <div style={{ display: "flex", gap: 8 }}>
              {Object.entries(LANGS).map(([k, label]) => (
                <Chip key={k} on={d.lang === k} onClick={() => setD({ ...d, lang: k })}>{label}</Chip>
              ))}
            </div>
          </Field>
          <Field label={t("nameLabel")}>
            <input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder={t("namePh")} style={inputCss} />
          </Field>
          <Field label={t("stateLabel")}>
            <select value={d.state} onChange={(e) => setD({ ...d, state: e.target.value })} style={inputCss}>
              {Object.keys(STATES).map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label={t("acresLabel")}>
            <input value={d.acres} onChange={(e) => setD({ ...d, acres: e.target.value.replace(/[^0-9.]/g, "") })} inputMode="decimal" placeholder={t("acresPh")} style={inputCss} />
          </Field>
        </>
      ) : (
        <>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 27, fontWeight: 600, margin: "0 0 8px" }}>{t("obTitle3")}</h1>
          <p style={{ fontSize: 14.5, color: C.inkSoft, lineHeight: 1.55, margin: "0 0 24px" }}>{t("obSub2")}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
            {Object.entries(ENTERPRISES).map(([k, m]) => {
              const on = d.enterprises.includes(k); const Icon = m.icon;
              return (
                <Chip key={k} on={on} onClick={() => toggle(k)} big>
                  <Icon size={15} color={on ? "#fff" : C.inkSoft} strokeWidth={2.1} />{t(m.key)}
                </Chip>
              );
            })}
          </div>
        </>
      )}
      <button disabled={!canNext} onClick={() => (step === 0 ? setStep(1) : onDone({ ...d, acres: d.acres || null }))}
        style={{ width: "100%", marginTop: 32, padding: 16, borderRadius: 14, border: "none", fontFamily: BODY,
          background: canNext ? C.brand : C.line, color: canNext ? "#fff" : C.inkSoft, fontSize: 15, fontWeight: 600, cursor: canNext ? "pointer" : "not-allowed" }}>
        {step === 0 ? t("continueBtn") : t("openFarm")}
      </button>
    </div>
  );
}

const inputCss = { width: "100%", padding: "13px 14px", borderRadius: 12, border: `1px solid ${C.line}`, fontSize: 15, fontFamily: BODY, color: C.ink, background: C.surface, outline: "none" };
function Field({ label, children }) {
  return <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 12.5, fontWeight: 600, color: C.inkSoft, marginBottom: 6 }}>{label}</div>{children}
  </div>;
}
function Chip({ children, on, onClick, big }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 6, padding: big ? "11px 15px" : "8px 13px", borderRadius: 999,
      border: `1px solid ${on ? C.brand : C.line}`, background: on ? C.brand : C.surface, color: on ? "#fff" : C.ink,
      fontSize: big ? 14 : 13, fontWeight: 500, cursor: "pointer", fontFamily: BODY, whiteSpace: "nowrap" }}>
      {children}
    </button>
  );
}

/* ================= home ================= */
function HomeScreen({ profile, tx, tasks, putTasks, weather, onAdd, onSeed, goBusiness }) {
  const { t, locale } = useI18n();
  const [draft, setDraft] = useState("");
  const key = todayISO().slice(0, 7);
  const mtx = tx.filter(x => (x.date || "").slice(0, 7) === key);
  const income = mtx.filter(x => x.type === "income").reduce((s, x) => s + x.amount, 0);
  const expense = mtx.filter(x => x.type === "expense").reduce((s, x) => s + x.amount, 0);
  const net = income - expense;
  const open = tasks.filter(x => !x.done).length;
  const advisory = buildAdvisory(weather);

  const addTask = () => {
    if (!draft.trim()) return;
    putTasks([{ id: Date.now().toString(36), text: draft.trim(), done: false }, ...tasks]);
    setDraft("");
  };
  const toggle = (id) => putTasks(tasks.map(x => x.id === id ? { ...x, done: !x.done } : x));
  const drop = (id) => putTasks(tasks.filter(x => x.id !== id));

  return (
    <>
      <div style={{ padding: "22px 18px 6px" }}>
        <div style={{ fontSize: 12.5, color: C.inkSoft }}>{longToday(locale)}</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 25, fontWeight: 600, marginTop: 2 }}>
          {t(greetKey())}, {profile.name.split(" ")[0]}
        </div>
      </div>

      {/* weather + advisory */}
      <Card>
        {weather ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: C.skySoft, display: "grid", placeItems: "center" }}>
                {weather.condKey === "wxRainy" || weather.condKey === "wxStorm" || weather.condKey === "wxDrizzle"
                  ? <CloudRain size={24} color={C.sky} /> : <Sun size={24} color={C.warn} />}
              </div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 600 }}>{weather.temp}°C</div>
                <div style={{ fontSize: 12.5, color: C.inkSoft }}>{t(weather.condKey)} · {profile.state}</div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right", fontSize: 12, color: C.inkSoft, lineHeight: 1.7 }}>
                <div><Droplets size={11} style={{ verticalAlign: -1 }} /> {weather.rainChance}% {t("rainWord")}</div>
                <div><Wind size={11} style={{ verticalAlign: -1 }} /> {weather.wind} km/h</div>
              </div>
            </div>
            {advisory && (
              <div style={{ display: "flex", gap: 9, marginTop: 14, padding: "11px 13px", borderRadius: 12,
                background: advisory.tone === "warn" ? C.warnSoft : C.incomeSoft }}>
                <AlertTriangle size={15} color={advisory.tone === "warn" ? C.warn : C.income} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 13, lineHeight: 1.45 }}>{t(advisory.key)}</div>
              </div>
            )}
            <div style={{ fontSize: 11, color: C.inkSoft, marginTop: 8 }}>{weather.live ? t("wxLive") : t("wxOffline")}</div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: C.inkSoft, animation: "pulse 1.5s infinite" }}>{t("wxLoading")}</div>
        )}
      </Card>

      {/* money snapshot */}
      <Card onClick={goBusiness}>
        <Label>{t("thisMonth")}</Label>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 32, fontWeight: 600, color: net >= 0 ? C.brand : C.expense, fontVariantNumeric: "tabular-nums" }}>
            {net < 0 ? "−" : ""}{fmt(Math.abs(net))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: net >= 0 ? C.income : C.expense, fontSize: 12.5, fontWeight: 600, paddingBottom: 6 }}>
            {net >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {mtx.length === 0 ? t("noEntries") : net >= 0 ? t("profit") : t("loss")}
          </div>
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 10, fontSize: 12.5, color: C.inkSoft }}>
          <span><b style={{ color: C.income }}>{fmt(income)}</b> {t("inWord")}</span>
          <span><b style={{ color: C.expense }}>{fmt(expense)}</b> {t("outWord")}</span>
          <span style={{ marginLeft: "auto", color: C.brand, fontWeight: 600 }}>{t("openLedger")}</span>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 10, padding: "0 16px" }}>
        <BigBtn onClick={() => onAdd("income")} bg={C.incomeSoft} fg={C.income} icon={<Plus size={18} strokeWidth={2.6} />}>{t("addIncome")}</BigBtn>
        <BigBtn onClick={() => onAdd("expense")} bg={C.expenseSoft} fg={C.expense} icon={<Minus size={18} strokeWidth={2.6} />}>{t("addExpense")}</BigBtn>
      </div>

      {/* today's work */}
      <Card>
        <Label>{t("todaysWork")} {open > 0 ? `· ${open} ${t("pendingWord")}` : ""}</Label>
        <div style={{ display: "flex", gap: 8, marginBottom: tasks.length ? 12 : 0 }}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder={t("taskPh")} style={{ ...inputCss, padding: "11px 13px", fontSize: 14, background: C.bg }} />
          <button onClick={addTask} aria-label="Add task" style={{ background: C.brand, border: "none", borderRadius: 12, width: 44, cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Plus size={18} color="#fff" strokeWidth={2.6} />
          </button>
        </div>
        {tasks.map(x => (
          <div key={x.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderTop: `1px solid ${C.line}` }}>
            <button onClick={() => toggle(x.id)} aria-label="Mark done" style={{ width: 21, height: 21, borderRadius: 7, flexShrink: 0, cursor: "pointer",
              border: `1.5px solid ${x.done ? C.income : C.line}`, background: x.done ? C.income : "transparent", display: "grid", placeItems: "center" }}>
              {x.done && <Check size={13} color="#fff" strokeWidth={3} />}
            </button>
            <span style={{ fontSize: 14, flex: 1, color: x.done ? C.inkSoft : C.ink, textDecoration: x.done ? "line-through" : "none" }}>{x.text}</span>
            <button onClick={() => drop(x.id)} aria-label="Delete task" style={{ background: "none", border: "none", cursor: "pointer", color: C.inkSoft, padding: 4 }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {tasks.length === 0 && <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 10 }}>{t("nothingPlanned")}</div>}
      </Card>

      {tx.length === 0 && (
        <div style={{ textAlign: "center", padding: "14px 16px 0" }}>
          <button onClick={onSeed} style={{ padding: "10px 16px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.surface, color: C.inkSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: BODY }}>
            {t("loadSample")}
          </button>
        </div>
      )}
    </>
  );
}

/* ================= diary ================= */
function DiaryScreen({ profile, diary, putDiary }) {
  const { t, locale } = useI18n();
  const [f, setF] = useState({ activity: "", farm: profile.enterprises[0] || "", note: "", date: todayISO() });
  const ok = !!f.activity;

  const save = () => {
    if (!ok) return;
    putDiary([{ id: Date.now().toString(36), ...f, note: f.note.trim() }, ...diary]);
    setF({ ...f, activity: "", note: "" });
  };

  const sorted = [...diary].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <>
      <div style={{ padding: "24px 18px 4px" }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 25, fontWeight: 600 }}>{t("diaryTitle")}</div>
        <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 3, lineHeight: 1.5 }}>{t("diarySub")}</div>
      </div>

      <Card>
        <Label>{t("logActivity")}</Label>
        <SheetLabel>{t("actLabel")}</SheetLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {Object.entries(ACTIVITIES).map(([k, m]) => {
            const on = f.activity === k; const Icon = m.icon;
            return (
              <Chip key={k} on={on} onClick={() => setF({ ...f, activity: k })}>
                <Icon size={14} color={on ? "#fff" : C.inkSoft} strokeWidth={2.1} />{t(m.key)}
              </Chip>
            );
          })}
        </div>
        {profile.enterprises.length > 0 && (
          <>
            <SheetLabel>{t("whichFarm")}</SheetLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {profile.enterprises.map(k => {
                const on = f.farm === k; const m = entMeta(k); const Icon = m.icon;
                return (
                  <Chip key={k} on={on} onClick={() => setF({ ...f, farm: k })}>
                    <Icon size={14} color={on ? "#fff" : C.inkSoft} strokeWidth={2.1} />{t(m.key)}
                  </Chip>
                );
              })}
            </div>
          </>
        )}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder={t("noteOpt")}
            style={{ ...inputCss, padding: "12px 14px", fontSize: 14, background: C.bg, flex: 1, minWidth: 0 }} />
          <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })}
            style={{ ...inputCss, width: "auto", padding: "12px", fontSize: 13, background: C.bg }} />
        </div>
        <button onClick={save} disabled={!ok} style={{ width: "100%", padding: 13, borderRadius: 12, border: "none", fontFamily: BODY,
          background: ok ? C.brand : C.line, color: ok ? "#fff" : C.inkSoft, fontSize: 14.5, fontWeight: 600, cursor: ok ? "pointer" : "not-allowed" }}>
          {t("saveActivity")}
        </button>
      </Card>

      <Card>
        <Label>{t("entriesLabel")} · {diary.length}</Label>
        {sorted.length === 0 && <div style={{ fontSize: 13, color: C.inkSoft }}>{t("noDiary")}</div>}
        {sorted.map(d => {
          const m = actMeta(d.activity); const Icon = m.icon;
          return (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: `1px solid ${C.line}` }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: C.incomeSoft, display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Icon size={18} color={C.brand} strokeWidth={2.1} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>
                  {t(m.key)}{d.note ? <span style={{ color: C.inkSoft, fontWeight: 400 }}> · {d.note}</span> : ""}
                </div>
                <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 1 }}>
                  {prettyDate(d.date, locale)}{d.farm ? ` · ${t(entMeta(d.farm).key)}` : ""}
                </div>
              </div>
              <button onClick={() => putDiary(diary.filter(x => x.id !== d.id))} aria-label="Delete"
                style={{ background: "none", border: "none", padding: 6, cursor: "pointer", color: C.inkSoft, flexShrink: 0 }}>
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
      </Card>
    </>
  );
}

/* ================= business ================= */
function Business({ profile, tx, putTx, onAdd, onSeed }) {
  const { t, locale } = useI18n();
  const [offset, setOffset] = useState(0);
  const [farm, setFarm] = useState("all");
  const now = new Date();
  const v = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const vk = `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}`;

  const monthTx = useMemo(() => tx
    .filter(x => (x.date || "").slice(0, 7) === vk)
    .filter(x => farm === "all" || x.farm === farm)
    .sort((a, b) => (a.date < b.date ? 1 : -1)), [tx, vk, farm]);

  const income = monthTx.filter(x => x.type === "income").reduce((s, x) => s + x.amount, 0);
  const expense = monthTx.filter(x => x.type === "expense").reduce((s, x) => s + x.amount, 0);
  const net = income - expense;
  const profit = net >= 0;
  const incomeW = income + expense === 0 ? 0 : (income / (income + expense)) * 100;

  const byFarm = useMemo(() => {
    const g = {};
    tx.filter(x => (x.date || "").slice(0, 7) === vk).forEach(x => {
      const k = x.farm || "general";
      g[k] = g[k] || { key: k, income: 0, expense: 0 };
      g[k][x.type] += x.amount;
    });
    return Object.values(g).sort((a, b) => (b.income - b.expense) - (a.income - a.expense));
  }, [tx, vk]);

  const cats = useMemo(() => {
    const g = {};
    monthTx.forEach(x => {
      const k = x.type + ":" + x.category;
      g[k] = g[k] || { type: x.type, category: x.category, total: 0 };
      g[k].total += x.amount;
    });
    return Object.values(g).sort((a, b) => b.total - a.total);
  }, [monthTx]);
  const maxBar = Math.max(1, ...cats.map(c => c.total));

  const removeTx = (id) => { if (window.confirm(t("confirmDelete"))) putTx(tx.filter(x => x.id !== id)); };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 16px 0" }}>
        <IconBtn onClick={() => setOffset(offset - 1)} label="Previous month"><ChevronLeft size={20} color={C.ink} /></IconBtn>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 21, fontWeight: 600 }}>{v.toLocaleDateString(locale, { month: "long" })}</div>
          <div style={{ fontSize: 12, color: C.inkSoft, marginTop: -2 }}>{v.getFullYear()}</div>
        </div>
        <IconBtn onClick={() => setOffset(Math.min(0, offset + 1))} label="Next month" disabled={offset >= 0}>
          <ChevronRight size={20} color={offset >= 0 ? C.line : C.ink} />
        </IconBtn>
      </div>

      <div style={{ display: "flex", gap: 7, overflowX: "auto", padding: "14px 16px 2px" }}>
        {["all", ...profile.enterprises].map(k => (
          <Chip key={k} on={farm === k} onClick={() => setFarm(k)}>
            {k === "all" ? t("allFarms") : t(entMeta(k).key)}
          </Chip>
        ))}
      </div>

      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: profit ? C.income : C.expense }}>
          {profit ? <TrendingUp size={16} strokeWidth={2.6} /> : <TrendingDown size={16} strokeWidth={2.6} />}
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>
            {income + expense === 0 ? t("noEntriesYet") : profit ? t("profitMonth") : t("lossMonth")}
          </span>
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: 42, fontWeight: 600, lineHeight: 1.05, marginTop: 6, color: profit ? C.brand : C.expense, fontVariantNumeric: "tabular-nums" }}>
          {net < 0 ? "−" : ""}{fmt(Math.abs(net))}
        </div>
        <div style={{ display: "flex", height: 12, borderRadius: 8, overflow: "hidden", background: C.line, marginTop: 18 }}>
          <div style={{ width: `${incomeW}%`, background: C.income, transition: "width .5s" }} />
          <div style={{ width: `${100 - incomeW}%`, background: C.expense, transition: "width .5s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
          <Stat dot={C.income} label={t("income")} value={fmt(income)} />
          <Stat dot={C.expense} label={t("expense")} value={fmt(expense)} align="right" />
        </div>
      </Card>

      <div style={{ display: "flex", gap: 10, padding: "14px 16px 0" }}>
        <BigBtn onClick={() => onAdd("income")} bg={C.incomeSoft} fg={C.income} icon={<Plus size={18} strokeWidth={2.6} />}>{t("addIncome")}</BigBtn>
        <BigBtn onClick={() => onAdd("expense")} bg={C.expenseSoft} fg={C.expense} icon={<Minus size={18} strokeWidth={2.6} />}>{t("addExpense")}</BigBtn>
      </div>

      {monthTx.length === 0 && tx.length === 0 ? (
        <div style={{ margin: "18px 16px 0", background: C.surface, borderRadius: 20, border: `1px dashed ${C.line}`, padding: "32px 22px", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: C.incomeSoft, display: "grid", placeItems: "center", margin: "0 auto 14px" }}>
            <Wallet size={22} color={C.income} />
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 600, marginBottom: 6 }}>{t("startLedger")}</div>
          <div style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.5, marginBottom: 18 }}>{t("startLedgerSub")}</div>
          <button onClick={onSeed} style={{ padding: "11px 18px", borderRadius: 12, border: `1px solid ${C.line}`, background: C.bg, color: C.ink, fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: BODY }}>
            {t("loadSampleEntries")}
          </button>
        </div>
      ) : (
        <>
          {farm === "all" && byFarm.length > 1 && (
            <Card>
              <Label>{t("byEnterprise")}</Label>
              {byFarm.map(f => {
                const m = entMeta(f.key); const Icon = m.icon; const n = f.income - f.expense;
                return (
                  <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0", borderTop: `1px solid ${C.line}` }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: C.bg, display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Icon size={17} color={C.brand} strokeWidth={2.1} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{t(m.key)}</div>
                      <div style={{ fontSize: 12, color: C.inkSoft }}>{fmt(f.income)} {t("inWord")} · {fmt(f.expense)} {t("outWord")}</div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: n >= 0 ? C.income : C.expense, fontVariantNumeric: "tabular-nums" }}>
                      {n < 0 ? "−" : "+"}{fmt(Math.abs(n))}
                    </div>
                  </div>
                );
              })}
            </Card>
          )}

          <Card>
            <Label>{t("whereMoney")}</Label>
            {cats.length === 0 && <div style={{ fontSize: 13, color: C.inkSoft }}>{t("noSelection")}</div>}
            {cats.map(b => {
              const col = b.type === "income" ? C.income : C.expense;
              return (
                <div key={b.type + b.category} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                    <span>{t(catMeta(b.type, b.category).key)}</span>
                    <span style={{ color: col, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fmt(b.total)}</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 6, background: C.line, overflow: "hidden" }}>
                    <div style={{ width: `${(b.total / maxBar) * 100}%`, height: "100%", background: col, borderRadius: 6, transition: "width .5s" }} />
                  </div>
                </div>
              );
            })}
          </Card>

          <Card>
            <Label>{t("entriesLabel")} · {monthTx.length}</Label>
            {monthTx.map(x => {
              const m = catMeta(x.type, x.category); const Icon = m.icon;
              const col = x.type === "income" ? C.income : C.expense;
              const soft = x.type === "income" ? C.incomeSoft : C.expenseSoft;
              return (
                <div key={x.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: `1px solid ${C.line}` }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: soft, display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <Icon size={18} color={col} strokeWidth={2.1} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {t(m.key)}{x.note ? <span style={{ color: C.inkSoft, fontWeight: 400 }}> · {x.note}</span> : ""}
                    </div>
                    <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 1 }}>
                      {prettyDate(x.date, locale)}{x.farm ? ` · ${t(entMeta(x.farm).key)}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: col, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                    {x.type === "income" ? "+" : "−"}{fmt(x.amount)}
                  </div>
                  <button onClick={() => removeTx(x.id)} aria-label="Delete entry"
                    style={{ background: "none", border: "none", padding: 6, cursor: "pointer", color: C.inkSoft, flexShrink: 0 }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </Card>
        </>
      )}
    </>
  );
}

/* ================= advisor ================= */
function AdvisorScreen({ profile, tx, diary, tasks, weather, settings, putSettings }) {
  const { t, lang } = useI18n();
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const month = todayISO().slice(0, 7);
  const mtx = tx.filter(x => (x.date || "").slice(0, 7) === month);
  const income = mtx.filter(x => x.type === "income").reduce((s, x) => s + x.amount, 0);
  const expense = mtx.filter(x => x.type === "expense").reduce((s, x) => s + x.amount, 0);
  const expByCat = {};
  mtx.filter(x => x.type === "expense").forEach(x => { expByCat[x.category] = (expByCat[x.category] || 0) + x.amount; });
  const topExp = Object.entries(expByCat).sort((a, b) => b[1] - a[1])[0];

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || busy || !settings.apiKey) return;
    const next = [...msgs, { role: "user", content: q }];
    setMsgs(next); setInput(""); setBusy(true);
    try {
      const system = buildSystem({ profile, tx, diary, tasks, weather, lang });
      const answer = await askAdvisor({
        apiKey: settings.apiKey,
        model: settings.model || DEFAULT_MODEL,
        system,
        messages: next.slice(-12).map(m => ({ role: m.role, content: m.content })),
      });
      setMsgs([...next, { role: "assistant", content: answer }]);
    } catch (e) {
      setMsgs([...next, { role: "assistant", content: `⚠️ ${t("advErr")}${e.message ? ` (${e.message})` : ""}`, error: true }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div style={{ padding: "24px 18px 4px" }}>
        <div style={{ fontFamily: DISPLAY, fontSize: 25, fontWeight: 600 }}>{t("advTitle")}</div>
        <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 3, lineHeight: 1.5 }}>{t("advSub")}</div>
      </div>

      {/* farm snapshot */}
      <Card>
        <Label>{t("advInsights")}</Label>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, background: C.bg, borderRadius: 14, padding: "12px 14px" }}>
            <div style={{ fontSize: 11.5, color: C.inkSoft, marginBottom: 3 }}>{t("thisMonth")}</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 600, color: income - expense >= 0 ? C.brand : C.expense }}>
              {income - expense < 0 ? "−" : ""}{fmt(Math.abs(income - expense))}
            </div>
          </div>
          <div style={{ flex: 1, background: C.bg, borderRadius: 14, padding: "12px 14px" }}>
            <div style={{ fontSize: 11.5, color: C.inkSoft, marginBottom: 3 }}>{t("insTopExpense")}</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 600, color: C.expense }}>
              {topExp ? fmt(topExp[1]) : "—"}
            </div>
            {topExp && <div style={{ fontSize: 11.5, color: C.inkSoft }}>{t(catMeta("expense", topExp[0]).key)}</div>}
          </div>
        </div>
      </Card>

      {!settings.apiKey ? (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: C.bg, display: "grid", placeItems: "center" }}>
              <KeyRound size={18} color={C.brand} />
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 600 }}>{t("advSetupTitle")}</div>
          </div>
          <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.5, marginBottom: 12 }}>{t("advSetupBody")}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="password" value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)} placeholder="sk-ant-…"
              style={{ ...inputCss, padding: "11px 13px", fontSize: 14, background: C.bg }} />
            <button onClick={() => keyDraft.trim() && putSettings({ ...settings, apiKey: keyDraft.trim() })}
              style={{ background: C.brand, border: "none", borderRadius: 12, padding: "0 18px", cursor: "pointer", color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: BODY, flexShrink: 0 }}>
              {t("advSaveKey")}
            </button>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            {msgs.length === 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {["sampleQ1", "sampleQ2", "sampleQ3"].map(k => (
                  <Chip key={k} on={false} onClick={() => send(t(k))}>{t(k)}</Chip>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginTop: i === 0 && msgs.length > 0 && !msgs[0].role ? 0 : 10 }}>
                <div style={{ maxWidth: "85%", padding: "10px 13px", borderRadius: 14, fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap",
                  background: m.role === "user" ? C.brand : m.error ? C.expenseSoft : C.bg,
                  color: m.role === "user" ? "#fff" : C.ink,
                  borderBottomRightRadius: m.role === "user" ? 4 : 14,
                  borderBottomLeftRadius: m.role === "user" ? 14 : 4 }}>
                  {m.content}
                </div>
              </div>
            ))}
            {busy && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, color: C.inkSoft, fontSize: 13 }}>
                <Bot size={15} color={C.brand} />
                <span style={{ animation: "pulse 1.2s infinite" }}>{t("advThinking")}</span>
              </div>
            )}
            <div ref={endRef} />
            <div style={{ display: "flex", gap: 8, marginTop: msgs.length || busy ? 14 : 12 }}>
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={t("advPh")} disabled={busy}
                style={{ ...inputCss, padding: "11px 13px", fontSize: 14, background: C.bg }} />
              <button onClick={() => send()} disabled={busy || !input.trim()} aria-label="Send"
                style={{ background: busy || !input.trim() ? C.line : C.brand, border: "none", borderRadius: 12, width: 44, cursor: busy ? "default" : "pointer", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Send size={17} color="#fff" strokeWidth={2.4} />
              </button>
            </div>
          </Card>
          <div style={{ padding: "10px 22px 0", fontSize: 11.5, color: C.inkSoft, lineHeight: 1.5, textAlign: "center" }}>
            {t("advDisclaimer")}
          </div>
        </>
      )}
    </>
  );
}

/* ================= profile ================= */
function ProfileScreen({ profile, onSave }) {
  const { t } = useI18n();
  const toggle = (k) => onSave({ ...profile, enterprises: profile.enterprises.includes(k) ? profile.enterprises.filter(x => x !== k) : [...profile.enterprises, k] });
  return (
    <div style={{ padding: "24px 16px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 4, padding: "0 2px" }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: C.brand, display: "grid", placeItems: "center" }}>
          <span style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, color: "#fff" }}>{profile.name.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: 21, fontWeight: 600 }}>{profile.name}</div>
          <div style={{ fontSize: 13, color: C.inkSoft }}>
            {profile.state}{profile.acres ? ` · ${profile.acres} acres` : ""}
          </div>
        </div>
      </div>

      <Card>
        <Label>{t("appLang")}</Label>
        <div style={{ display: "flex", gap: 8 }}>
          {Object.entries(LANGS).map(([k, label]) => (
            <Chip key={k} on={(profile.lang || "en") === k} onClick={() => onSave({ ...profile, lang: k })}>{label}</Chip>
          ))}
        </div>
      </Card>

      <Card>
        <Label>{t("myEnterprises")}</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {Object.entries(ENTERPRISES).map(([k, m]) => {
            const on = profile.enterprises.includes(k); const Icon = m.icon;
            return (
              <Chip key={k} on={on} onClick={() => toggle(k)}>
                <Icon size={14} color={on ? "#fff" : C.inkSoft} strokeWidth={2.1} />{t(m.key)}
              </Chip>
            );
          })}
        </div>
        <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 12, lineHeight: 1.5 }}>{t("entNote")}</div>
      </Card>
    </div>
  );
}

/* ================= add sheet ================= */
function AddSheet({ type, farms, onClose, onSave }) {
  const { t } = useI18n();
  const [f, setF] = useState({ amount: "", category: "", note: "", date: todayISO(), farm: farms[0] || "" });
  const ok = Number(f.amount) > 0 && f.category;
  const col = type === "income" ? C.income : C.expense;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,30,22,.42)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 60 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface, width: "100%", maxWidth: 460, borderRadius: "24px 24px 0 0", padding: "18px 20px 26px", animation: "rise .25s ease", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <span style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 600, color: col }}>
            {type === "income" ? t("addIncome") : t("addExpense")}
          </span>
          <button onClick={onClose} aria-label="Close" style={{ marginLeft: "auto", background: C.bg, border: "none", borderRadius: 10, padding: 7, cursor: "pointer" }}>
            <X size={18} color={C.ink} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, borderBottom: `2px solid ${C.line}`, paddingBottom: 8, marginBottom: 18 }}>
          <span style={{ fontFamily: DISPLAY, fontSize: 30, color: C.inkSoft }}>₹</span>
          <input value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value.replace(/[^0-9]/g, "") })} inputMode="numeric" placeholder="0" autoFocus
            style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 600, border: "none", outline: "none", width: "100%", color: C.ink, background: "transparent" }} />
        </div>

        {farms.length > 0 && (
          <>
            <SheetLabel>{t("whichFarm")}</SheetLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {farms.map(k => {
                const on = f.farm === k; const m = entMeta(k); const Icon = m.icon;
                return (
                  <Chip key={k} on={on} onClick={() => setF({ ...f, farm: k })}>
                    <Icon size={14} color={on ? "#fff" : C.inkSoft} strokeWidth={2.1} />{t(m.key)}
                  </Chip>
                );
              })}
            </div>
          </>
        )}

        <SheetLabel>{t("category")}</SheetLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {Object.entries(CATS[type]).map(([k, m]) => {
            const on = f.category === k; const Icon = m.icon;
            return (
              <button key={k} onClick={() => setF({ ...f, category: k })} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 999, cursor: "pointer", fontFamily: BODY,
                border: `1px solid ${on ? col : C.line}`, background: on ? col : C.surface, color: on ? "#fff" : C.ink, fontSize: 13, fontWeight: 500 }}>
                <Icon size={14} color={on ? "#fff" : C.inkSoft} strokeWidth={2.1} />{t(m.key)}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder={t("noteOpt")}
            style={{ ...inputCss, padding: "12px 14px", fontSize: 14, background: C.bg, flex: 1, minWidth: 0 }} />
          <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })}
            style={{ ...inputCss, width: "auto", padding: "12px", fontSize: 13, background: C.bg }} />
        </div>

        <button onClick={() => ok && onSave({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), type, category: f.category, amount: Number(f.amount), note: f.note.trim(), date: f.date || todayISO(), farm: f.farm })}
          disabled={!ok} style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", fontFamily: BODY,
            background: ok ? col : C.line, color: ok ? "#fff" : C.inkSoft, fontSize: 15, fontWeight: 600, cursor: ok ? "pointer" : "not-allowed" }}>
          {type === "income" ? t("saveIncome") : t("saveExpense")}
        </button>
      </div>
    </div>
  );
}

/* ================= nav + atoms ================= */
function Nav({ tab, setTab }) {
  const { t } = useI18n();
  const items = [
    { k: "home", key: "navHome", Icon: HomeIcon },
    { k: "diary", key: "navDiary", Icon: NotebookPen },
    { k: "business", key: "navBusiness", Icon: Wallet },
    { k: "advisor", key: "navAdvisor", Icon: Bot },
    { k: "profile", key: "navProfile", Icon: User },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40 }}>
      <div style={{ maxWidth: 460, margin: "0 auto", background: C.surface, borderTop: `1px solid ${C.line}`, display: "flex", padding: "8px 6px 14px" }}>
        {items.map(({ k, key, Icon }) => {
          const on = tab === k;
          return (
            <button key={k} onClick={() => setTab(k)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "grid", justifyItems: "center", gap: 3, padding: "6px 0", fontFamily: BODY }}>
              <Icon size={20} color={on ? C.brand : C.inkSoft} strokeWidth={on ? 2.4 : 1.9} />
              <span style={{ fontSize: 10.5, fontWeight: on ? 600 : 500, color: on ? C.brand : C.inkSoft }}>{t(key)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
function Card({ children, onClick }) {
  return (
    <div onClick={onClick} style={{ margin: "14px 16px 0", background: C.surface, borderRadius: 20, border: `1px solid ${C.line}`, padding: "16px 18px", cursor: onClick ? "pointer" : "default" }}>
      {children}
    </div>
  );
}
function Label({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: C.inkSoft, letterSpacing: .4, textTransform: "uppercase", marginBottom: 10 }}>{children}</div>;
}
function SheetLabel({ children }) {
  return <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 8, fontWeight: 600 }}>{children}</div>;
}
function IconBtn({ children, onClick, label, disabled }) {
  return <button onClick={onClick} aria-label={label} disabled={disabled}
    style={{ background: C.surface, border: `1px solid ${C.line}`, borderRadius: 12, padding: 8, cursor: disabled ? "default" : "pointer", display: "grid", placeItems: "center" }}>{children}</button>;
}
function Stat({ dot, label, value, align }) {
  return (
    <div style={{ textAlign: align || "left" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: align === "right" ? "flex-end" : "flex-start" }}>
        <span style={{ width: 8, height: 8, borderRadius: 4, background: dot }} />
        <span style={{ fontSize: 12, color: C.inkSoft }}>{label}</span>
      </div>
      <div style={{ fontSize: 17, fontWeight: 600, marginTop: 3, fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
}
function BigBtn({ children, onClick, bg, fg, icon }) {
  return <button onClick={onClick} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: 15, borderRadius: 16, border: "none", background: bg, color: fg, fontSize: 14.5, fontWeight: 600, cursor: "pointer", fontFamily: BODY }}>{icon}{children}</button>;
}
