import { T } from "../theme/ThemeProvider.jsx";
import { useApp } from "../store/AppStore.jsx";
import BottomNav from "./BottomNav.jsx";
import { ToastHost } from "../components/index.js";

import Splash from "../pages/Splash.jsx";
import LanguageSelect from "../pages/LanguageSelect.jsx";
import Onboarding from "../pages/Onboarding.jsx";
import AuthFlow from "../pages/AuthFlow.jsx";
import Home from "../pages/Home.jsx";
import AIHub from "../pages/AIHub.jsx";
import Market from "../pages/Market.jsx";
import Services from "../pages/Services.jsx";
import Profile from "../pages/Profile.jsx";
import Settings from "../pages/Settings.jsx";
import FeatureDetail from "../pages/FeatureDetail.jsx";
import AIChat from "../pages/AIChat.jsx";
import WeatherDashboard from "../pages/WeatherDashboard.jsx";
import FarmLocations from "../pages/FarmLocations.jsx";
import NearbyServices from "../pages/NearbyServices.jsx";
import MandiPrices from "../pages/MandiPrices.jsx";
import SchemeExplorer from "../pages/SchemeExplorer.jsx";

const TAB_SCREENS = { home: Home, ai: AIHub, market: Market, services: Services, profile: Profile };

/* Renders one pushed detail screen from a stack descriptor. */
function StackScreen({ item }) {
  if (item.kind === "settings") return <Settings />;
  if (item.kind === "feature") return <FeatureDetail {...item.props} />;
  if (item.kind === "chat") return <AIChat {...item.props} />;
  if (item.kind === "weather") return <WeatherDashboard />;
  if (item.kind === "farmLocations") return <FarmLocations />;
  if (item.kind === "nearby") return <NearbyServices />;
  if (item.kind === "mandiPrices") return <MandiPrices />;
  if (item.kind === "schemeExplorer") return <SchemeExplorer />;
  return null;
}

export default function ScreenRouter() {
  const { stage, tab, stack } = useApp();

  // Pre-app flow — full-screen, no bottom nav.
  if (stage !== "app") {
    const Flow = { splash: Splash, language: LanguageSelect, onboarding: Onboarding, auth: AuthFlow }[stage] || Splash;
    return (
      <div style={{ maxWidth: 460, margin: "0 auto", minHeight: "100vh", background: T.bg }}>
        <Flow />
        <ToastHost />
      </div>
    );
  }

  const TabScreen = TAB_SCREENS[tab] || Home;
  const top = stack[stack.length - 1];

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", minHeight: "100vh", background: T.bg, position: "relative" }}>
      <div style={{ paddingBottom: 84 }}>
        {top
          ? <div key={stack.length} style={{ animation: "ag-push-in .26s var(--ag-ease)" }}><StackScreen item={top} /></div>
          : <div key={tab} style={{ animation: "ag-fade .22s var(--ag-ease)" }}><TabScreen /></div>}
      </div>
      <BottomNav />
      <ToastHost />
    </div>
  );
}
