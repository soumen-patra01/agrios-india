/* Browser Notification API wrapper — local alerts only, no backend required.
   Push notifications (FCM) will layer on top when a server is added; this
   service handles permission, local dispatch, and settings persistence. */

import { storage } from "../../utils/storage.js";

const ENABLED_KEY = "notif:on";
const PROMPTED_KEY = "notif:prompted";

export const notificationService = {
  isSupported() {
    return typeof window !== "undefined" && "Notification" in window;
  },

  getPermission() {
    return this.isSupported() ? Notification.permission : "denied";
  },

  async requestPermission() {
    if (!this.isSupported()) return "denied";
    const result = await Notification.requestPermission();
    storage.set(PROMPTED_KEY, true);
    if (result === "granted") storage.set(ENABLED_KEY, true);
    return result;
  },

  isEnabled() {
    return this.getPermission() === "granted" && storage.get(ENABLED_KEY, true);
  },

  setEnabled(v) {
    storage.set(ENABLED_KEY, v);
  },

  hasPrompted() {
    return storage.get(PROMPTED_KEY, false);
  },

  markPrompted() {
    storage.set(PROMPTED_KEY, true);
  },

  dispatch(title, body, tag = "agrios") {
    if (!this.isEnabled()) return;
    try {
      new Notification(title, { body, tag, icon: "/icon.svg", badge: "/icon.svg" });
    } catch { /* non-fatal — some browsers restrict outside user gesture */ }
  },
};
