import { ThemeProvider } from "./theme/ThemeProvider.jsx";
import { AppProvider } from "./store/AppStore.jsx";
import ScreenRouter from "./navigation/ScreenRouter.jsx";

/* Composition root. Providers wrap the whole tree; ScreenRouter renders the
   right screen for the current flow stage / tab / navigation stack. */
export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <ScreenRouter />
      </AppProvider>
    </ThemeProvider>
  );
}
