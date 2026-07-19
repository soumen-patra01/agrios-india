/* Live price proxy — calls api/prices.js when a real feed is configured.
   Returns { unavailable: true } until PRICE_FEED_URL is set on the server.
   The marketTool and MandiPrices UI degrade gracefully on unavailability. */

import { authFetch } from "../firebase/authFetch.js";

export async function fetchLivePrice(cropId, mandiName, { signal } = {}) {
  try {
    const res = await authFetch("/api/prices", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cropId, mandi: mandiName }),
      signal,
    });
    if (res.status === 503) return { unavailable: true };
    if (!res.ok) return { unavailable: true };
    return res.json();
  } catch {
    return { unavailable: true };
  }
}
