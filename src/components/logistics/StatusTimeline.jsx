import { T } from "../../theme/ThemeProvider.jsx";

/* Vertical event timeline. entries: [{ status/label, at }]. */
export default function StatusTimeline({ entries = [], labelFor }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {entries.map((e, i) => {
        const last = i === entries.length - 1;
        const label = labelFor ? labelFor(e.status) : (e.label || e.status);
        return (
          <div key={i} style={{ display: "flex", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%",
                background: last ? T.primary : T.line, marginTop: 4, flexShrink: 0 }} />
              {!last && <div style={{ width: 2, flex: 1, background: T.line, minHeight: 22 }} />}
            </div>
            <div style={{ paddingBottom: last ? 0 : 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{label}</div>
              {e.at && <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 1 }}>
                {new Date(e.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </div>}
              {e.note && <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 2 }}>{e.note}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
