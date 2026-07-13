/* Weather provider registry — the seam that keeps the app independent of any
   single weather source. Default is keyless Open-Meteo; keyed providers can be
   selected once their server-side key is configured. */

import { openMeteoProvider } from "./providers/openMeteo.js";
import { openWeatherProvider } from "./providers/openWeather.js";

const PROVIDERS = {
  [openMeteoProvider.id]: openMeteoProvider,
  [openWeatherProvider.id]: openWeatherProvider,
};

const DEFAULT_ID = openMeteoProvider.id;

export function getWeatherProvider(id = DEFAULT_ID) {
  return PROVIDERS[id] || PROVIDERS[DEFAULT_ID];
}

export function listWeatherProviders() {
  return Object.values(PROVIDERS).map(({ id, label, requiresKey }) => ({ id, label, requiresKey }));
}
