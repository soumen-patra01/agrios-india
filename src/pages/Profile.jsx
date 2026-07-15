import { T } from "../theme/ThemeProvider.jsx";
import Icon from "../components/Icon.jsx";
import { AppBar, Card, Dialog } from "../components/index.js";
import { useApp } from "../store/AppStore.jsx";
import { PROFILE_ITEMS } from "../constants/content.js";
import { initials } from "../utils/format.js";
import { useState } from "react";

export default function Profile() {
  const { t, user, push, logout } = useApp();
  const [confirm, setConfirm] = useState(false);

  const tap = (id) => {
    if (id === "settings") return push({ kind: "settings" });
    if (id === "language") return push({ kind: "settings" });
    const item = PROFILE_ITEMS.find((x) => x.id === id);
    push({ kind: "feature", props: { title: t(item.title), desc: "Manage your " + t(item.title).toLowerCase() + ".", icon: item.icon, a: "primary" } });
  };

  return (
    <>
      <AppBar title={t("profileTitle")} large action={
        <button onClick={() => push({ kind: "settings" })} style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 12, padding: 8, cursor: "pointer", color: T.ink, display: "flex" }}>
          <Icon name="Settings" size={19} />
        </button>
      } />
      <div style={{ padding: "4px 16px 24px", display: "flex", flexDirection: "column", gap: 16, animation: "ag-fade .25s var(--ag-ease)" }}>
        {/* identity */}
        <Card elevated style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 58, height: 58, borderRadius: 18, background: `linear-gradient(150deg, ${T.primary}, ${T.primaryDark})`, color: "#fff", display: "grid", placeItems: "center", fontFamily: T.display, fontWeight: 700, fontSize: 22 }}>
            {initials(user?.name || "Farmer")}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: T.display, fontSize: 19, fontWeight: 700 }}>{user?.name || "Farmer"}</div>
            <div style={{ fontSize: 13, color: T.inkSoft }}>+91 {user?.phone || "—"}</div>
          </div>
          <button onClick={() => tap("farm")} style={{ background: T.surface2, border: "none", borderRadius: 12, padding: "8px 10px", cursor: "pointer", color: T.primary, fontSize: 12.5, fontWeight: 600, fontFamily: T.body }}>Edit</button>
        </Card>

        {/* subscription */}
        <div onClick={() => tap("subscription")}
          style={{ borderRadius: T.rLg, padding: 16, cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", gap: 13,
            background: `linear-gradient(120deg, #B8860B, #C9930B)`, boxShadow: T.shadowMd }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(255,255,255,.2)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="Crown" size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: T.display, fontSize: 16, fontWeight: 700 }}>AgriOS Premium</div>
            <div style={{ fontSize: 12.5, opacity: .92 }}>Unlock every AI assistant & report</div>
          </div>
          <Icon name="ChevronRight" size={20} />
        </div>

        {/* menu */}
        <Card pad={6}>
          {PROFILE_ITEMS.map((it, i) => (
            <button key={it.id} onClick={() => tap(it.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 13, padding: "13px 12px", cursor: "pointer",
                background: "none", border: "none", borderTop: i ? `1px solid ${T.lineSoft}` : "none", fontFamily: T.body }}>
              <div style={{ width: 36, height: 36, borderRadius: 11, background: T.surface2, color: T.inkSoft, display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Icon name={it.icon} size={18} />
              </div>
              <span style={{ flex: 1, textAlign: "left", fontSize: 14.5, fontWeight: 500, color: T.ink }}>{t(it.title)}</span>
              <Icon name="ChevronRight" size={18} style={{ color: T.inkFaint }} />
            </button>
          ))}
        </Card>

        <button onClick={() => setConfirm(true)}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: 14, borderRadius: T.rLg, cursor: "pointer",
            background: T.redSoft, color: T.red, border: "none", fontFamily: T.body, fontSize: 14.5, fontWeight: 600 }}>
          <Icon name="LogOut" size={18} /> {t("logout")}
        </button>

        <div style={{ textAlign: "center", fontSize: 11.5, color: T.inkFaint }}>AgriOS India · v0.9.0 (Phase 7C)</div>
      </div>

      <Dialog open={confirm} onClose={() => setConfirm(false)} title={t("logout") + "?"}
        body={t("logoutBody")} icon="LogOut" danger
        confirmLabel={t("logout")} cancelLabel={t("cancel")} onConfirm={logout} />
    </>
  );
}
