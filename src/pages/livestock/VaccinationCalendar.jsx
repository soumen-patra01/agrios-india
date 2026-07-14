import { useState, useEffect } from "react";
import { T } from "../../theme/ThemeProvider.jsx";
import { AppBar, Chip } from "../../components/index.js";
import { useApp } from "../../store/AppStore.jsx";
import { vaccinationService } from "../../services/livestock/vaccinationService.js";
import StatTile from "../../components/erp/StatTile.jsx";
import { RecordRow, EmptyHint, Pill } from "../../components/erp/RecordList.jsx";

const TABS = ["Upcoming", "Missed", "History"];
const fmtDate = (d) => d ? new Date(d + "T12:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";

export default function VaccinationCalendar() {
  const { pop, push } = useApp();
  const [tab, setTab]           = useState("Upcoming");
  const [upcoming, setUpcoming] = useState([]);
  const [missed, setMissed]     = useState([]);
  const [history, setHistory]   = useState([]);

  useEffect(() => {
    vaccinationService.upcoming(60).then(setUpcoming);
    vaccinationService.missed().then(setMissed);
    vaccinationService.allHealth().then(setHistory);
  }, []);

  const list = tab === "Upcoming" ? upcoming : tab === "Missed" ? missed : history.slice(0, 50);

  const typeLabel = (t) => t.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

  return (
    <>
      <AppBar title="Vaccination Calendar" onBack={pop} />

      <div style={{ display: "flex", gap: 10, padding: "8px 16px 4px", overflowX: "auto" }}>
        <StatTile a="blue" label="Upcoming (60d)" value={upcoming.length} />
        <StatTile a={missed.length > 0 ? "red" : "primary"} label="Missed" value={missed.length} />
        <StatTile a="primary" label="Total Records" value={history.length} />
      </div>

      <div style={{ display: "flex", gap: 8, padding: "10px 16px 4px" }}>
        {TABS.map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
            {t}{t === "Missed" && missed.length > 0 ? ` (${missed.length})` : ""}
          </Chip>
        ))}
      </div>

      <div style={{ padding: "8px 16px 32px", display: "flex", flexDirection: "column", gap: 8 }}>
        {list.length === 0
          ? <EmptyHint icon="Syringe"
              text={tab === "Upcoming" ? "No vaccinations due in the next 60 days — log health events with a due date in each livestock module"
                : tab === "Missed" ? "Nothing missed — well done!"
                : "Health events logged in any livestock module appear here"} />
          : list.map((ev) => (
            <RecordRow key={ev.id}
              icon={ev.enterpriseIcon || "Syringe"}
              iconColor={tab === "Missed" ? T.red : T.blue}
              iconBg={tab === "Missed" ? T.redSoft : T.blueSoft}
              title={`${typeLabel(ev.type)} — ${ev.enterpriseLabel}`}
              badge={tab === "Upcoming" ? <Pill fg={T.blue} bg={T.blueSoft}>due {fmtDate(ev.dueDate)}</Pill>
                : tab === "Missed" ? <Pill fg={T.red} bg={T.redSoft}>missed {fmtDate(ev.dueDate)}</Pill> : null}
              subtitle={`Logged ${fmtDate(ev.date)}${ev.note ? ` · ${ev.note}` : ""}`} />
          ))}

        {tab === "Missed" && missed.length > 0 && (
          <div style={{ background: T.redSoft, borderRadius: T.rLg, padding: "12px 14px",
            borderLeft: `4px solid ${T.red}`, fontSize: 12.5, color: T.inkSoft }}>
            Open the livestock module and log the vaccination once done — it clears from this list automatically.
          </div>
        )}
      </div>
    </>
  );
}
