import { T } from "../theme/ThemeProvider.jsx";
import Icon from "../components/Icon.jsx";
import { AppBar, Screen, Card, Skeleton, accent } from "../components/index.js";
import { useApp } from "../store/AppStore.jsx";

/* Generic premium detail screen for any not-yet-built module. Shows a hero,
   a "coming soon" message and tasteful skeleton previews so it still feels
   like a real, designed page rather than a dead end. */
export default function FeatureDetail({ title, desc, icon = "Sparkles", a = "primary" }) {
  const { pop, t } = useApp();
  const c = accent(a);
  return (
    <>
      <AppBar title={title} onBack={pop} />
      <Screen gap={16}>
        <Card elevated style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 60, height: 60, borderRadius: 20, background: c.bg, color: c.fg, display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name={icon} size={30} strokeWidth={2} />
          </div>
          <div>
            <div style={{ fontFamily: T.display, fontSize: 19, fontWeight: 700 }}>{title}</div>
            {desc && <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 3, lineHeight: 1.45 }}>{desc}</div>}
          </div>
        </Card>

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: T.rMd, background: T.primarySoft, color: T.primary }}>
          <Icon name="Wrench" size={16} />
          <div style={{ fontSize: 13, fontWeight: 600 }}>{t("comingSoon")}</div>
        </div>
        <div style={{ fontSize: 13.5, color: T.inkSoft, lineHeight: 1.55, padding: "0 2px" }}>{t("comingSoonSub")}</div>

        {/* skeleton preview of the future content */}
        <Card>
          <Skeleton w="45%" h={13} />
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ flex: 1 }}>
                <Skeleton w="100%" h={60} r={14} />
                <Skeleton w="70%" h={11} style={{ marginTop: 10 }} />
                <Skeleton w="50%" h={10} style={{ marginTop: 7 }} />
              </div>
            ))}
          </div>
        </Card>
        <Card>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderTop: i ? `1px solid ${T.lineSoft}` : "none" }}>
              <Skeleton w={40} h={40} r={12} />
              <div style={{ flex: 1 }}>
                <Skeleton w="55%" h={12} />
                <Skeleton w="35%" h={10} style={{ marginTop: 7 }} />
              </div>
              <Skeleton w={48} h={22} r={11} />
            </div>
          ))}
        </Card>
      </Screen>
    </>
  );
}
