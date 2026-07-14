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
import FarmLedger from "../pages/FarmLedger.jsx";
import CropCalendar        from "../pages/CropCalendar.jsx";
import DiagnosticsHome     from "../pages/DiagnosticsHome.jsx";
import DiagnosticFlow      from "../pages/DiagnosticFlow.jsx";
import DiagnosticResult    from "../pages/DiagnosticResult.jsx";
import DiagnosticHistory   from "../pages/DiagnosticHistory.jsx";
import FarmERPHub          from "../pages/erp/FarmERPHub.jsx";
import FarmProfiles        from "../pages/erp/FarmProfiles.jsx";
import LandManager         from "../pages/erp/LandManager.jsx";
import TaskManager         from "../pages/erp/TaskManager.jsx";
import InventoryManager    from "../pages/erp/InventoryManager.jsx";
import AssetManager        from "../pages/erp/AssetManager.jsx";
import EmployeeManager     from "../pages/erp/EmployeeManager.jsx";
import CRMManager          from "../pages/erp/CRMManager.jsx";
import ProductionDashboard from "../pages/erp/ProductionDashboard.jsx";
import ReportsCenter       from "../pages/erp/ReportsCenter.jsx";
import FarmAnalytics       from "../pages/erp/FarmAnalytics.jsx";
import AIInsights          from "../pages/erp/AIInsights.jsx";
import DeviceManager       from "../pages/erp/DeviceManager.jsx";
import PigManager          from "../pages/livestock/PigManager.jsx";
import SheepManager        from "../pages/livestock/SheepManager.jsx";
import VaccinationCalendar from "../pages/livestock/VaccinationCalendar.jsx";
import LivestockHub        from "../pages/livestock/LivestockHub.jsx";
import PoultryManager      from "../pages/livestock/PoultryManager.jsx";
import DairyManager        from "../pages/livestock/DairyManager.jsx";
import GoatManager         from "../pages/livestock/GoatManager.jsx";
import FishManager         from "../pages/livestock/FishManager.jsx";
import BeeManager          from "../pages/livestock/BeeManager.jsx";
import BusinessDashboard   from "../pages/business/BusinessDashboard.jsx";
import PLReport            from "../pages/business/PLReport.jsx";
import CashFlowPage        from "../pages/business/CashFlowPage.jsx";
import MarketplaceHub      from "../pages/marketplace/MarketplaceHub.jsx";
import ProductDetail       from "../pages/marketplace/ProductDetail.jsx";
import StoreView           from "../pages/marketplace/StoreView.jsx";
import CartPage            from "../pages/marketplace/CartPage.jsx";
import CheckoutPage        from "../pages/marketplace/CheckoutPage.jsx";
import MyOrdersPage        from "../pages/marketplace/MyOrdersPage.jsx";
import WishlistPage        from "../pages/marketplace/WishlistPage.jsx";
import SellerDashboard     from "../pages/marketplace/SellerDashboard.jsx";
import MLOpsHub            from "../pages/mlops/MLOpsHub.jsx";
import DatasetBrowser      from "../pages/mlops/DatasetBrowser.jsx";
import DatasetDetail       from "../pages/mlops/DatasetDetail.jsx";
import AnnotationWorkspace from "../pages/mlops/AnnotationWorkspace.jsx";
import ModelRegistryPage   from "../pages/mlops/ModelRegistryPage.jsx";
import ExperimentList      from "../pages/mlops/ExperimentList.jsx";
import TrainingDashboard   from "../pages/mlops/TrainingDashboard.jsx";
import MonitoringDashboard from "../pages/mlops/MonitoringDashboard.jsx";

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
  if (item.kind === "farmLedger") return <FarmLedger />;
  if (item.kind === "cropCalendar")      return <CropCalendar />;
  if (item.kind === "diagnosticsHome")   return <DiagnosticsHome />;
  if (item.kind === "diagnosticFlow")    return <DiagnosticFlow    {...(item.props || {})} />;
  if (item.kind === "diagnosticResult")  return <DiagnosticResult  {...(item.props || {})} />;
  if (item.kind === "diagnosticHistory") return <DiagnosticHistory />;
  if (item.kind === "diagnosticConsent")    return <DiagnosticsHome />;
  if (item.kind === "farmErp")              return <FarmERPHub />;
  if (item.kind === "farmProfiles")         return <FarmProfiles />;
  if (item.kind === "landManager")          return <LandManager />;
  if (item.kind === "erpTasks")             return <TaskManager />;
  if (item.kind === "erpInventory")         return <InventoryManager />;
  if (item.kind === "erpAssets")            return <AssetManager />;
  if (item.kind === "erpEmployees")         return <EmployeeManager />;
  if (item.kind === "erpCrm")               return <CRMManager />;
  if (item.kind === "erpProduction")        return <ProductionDashboard />;
  if (item.kind === "erpReports")           return <ReportsCenter />;
  if (item.kind === "erpAnalytics")         return <FarmAnalytics />;
  if (item.kind === "erpInsights")          return <AIInsights />;
  if (item.kind === "erpDevices")           return <DeviceManager />;
  if (item.kind === "pigManager")           return <PigManager />;
  if (item.kind === "sheepManager")         return <SheepManager />;
  if (item.kind === "vaccinationCalendar")  return <VaccinationCalendar />;
  if (item.kind === "livestockHub")         return <LivestockHub />;
  if (item.kind === "poultryManager")       return <PoultryManager />;
  if (item.kind === "dairyManager")         return <DairyManager />;
  if (item.kind === "goatManager")          return <GoatManager />;
  if (item.kind === "fishManager")          return <FishManager />;
  if (item.kind === "beeManager")           return <BeeManager />;
  if (item.kind === "businessDashboard")    return <BusinessDashboard />;
  if (item.kind === "plReport")             return <PLReport />;
  if (item.kind === "cashFlow")             return <CashFlowPage />;
  if (item.kind === "marketplace")          return <MarketplaceHub      {...(item.props || {})} />;
  if (item.kind === "mpProduct")            return <ProductDetail       {...(item.props || {})} />;
  if (item.kind === "mpStore")              return <StoreView           {...(item.props || {})} />;
  if (item.kind === "mpCart")               return <CartPage />;
  if (item.kind === "mpCheckout")           return <CheckoutPage />;
  if (item.kind === "mpOrders")             return <MyOrdersPage />;
  if (item.kind === "mpWishlist")           return <WishlistPage />;
  if (item.kind === "mpSeller")             return <SellerDashboard />;
  if (item.kind === "mlopsHub")             return <MLOpsHub />;
  if (item.kind === "datasetBrowser")       return <DatasetBrowser />;
  if (item.kind === "datasetDetail")        return <DatasetDetail       {...(item.props || {})} />;
  if (item.kind === "annotationWorkspace")  return <AnnotationWorkspace {...(item.props || {})} />;
  if (item.kind === "modelRegistryPage")    return <ModelRegistryPage />;
  if (item.kind === "experimentList")       return <ExperimentList />;
  if (item.kind === "trainingDashboard")    return <TrainingDashboard />;
  if (item.kind === "monitoringDashboard")  return <MonitoringDashboard />;
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
