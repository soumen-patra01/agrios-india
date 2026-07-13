import { storage } from "../../../utils/storage.js";

const KEY_ALERTS = "mlops:active_alerts";
const KEY_THRESHOLDS = "mlops:alert_thresholds";

const DEFAULT_THRESHOLDS = {
  maxLatencyMs:    3000,
  minConfidence:   0.55,
  maxErrorRate:    0.05,
  minSuccessRate:  0.95,
  driftSeverity:   "medium",
};

export const alertEngine = {
  getThresholds() { return storage.get(KEY_THRESHOLDS, DEFAULT_THRESHOLDS); },
  setThresholds(patch) { storage.set(KEY_THRESHOLDS, { ...this.getThresholds(), ...patch }); },

  _getAlerts() { return storage.get(KEY_ALERTS, []); },
  _saveAlerts(a) { storage.set(KEY_ALERTS, a); },

  check(stats) {
    if (!stats) return [];
    const t = this.getThresholds();
    const fired = [];

    if (stats.avgLatencyMs > t.maxLatencyMs) {
      fired.push(this._fire("latency_high", `Avg latency ${stats.avgLatencyMs}ms exceeds ${t.maxLatencyMs}ms`, "warning", stats));
    }
    if (stats.avgConfidence < t.minConfidence) {
      fired.push(this._fire("low_confidence", `Avg confidence ${(stats.avgConfidence * 100).toFixed(1)}% below ${(t.minConfidence * 100).toFixed(1)}%`, "warning", stats));
    }
    if (stats.errorRate > t.maxErrorRate) {
      fired.push(this._fire("high_error_rate", `Error rate ${(stats.errorRate * 100).toFixed(1)}% exceeds ${(t.maxErrorRate * 100).toFixed(1)}%`, "critical", stats));
    }
    return fired;
  },

  _fire(type, message, severity, context) {
    const alert = {
      id: `alt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type, message, severity, context,
      dismissed: false,
      firedAt: new Date().toISOString(),
    };
    const existing = this._getAlerts();
    const deduped = existing.filter((a) => a.type !== type || a.dismissed);
    this._saveAlerts([alert, ...deduped].slice(0, 50));
    return alert;
  },

  getActive() {
    return this._getAlerts().filter((a) => !a.dismissed);
  },

  dismiss(id) {
    const alerts = this._getAlerts().map((a) => a.id === id ? { ...a, dismissed: true } : a);
    this._saveAlerts(alerts);
  },

  dismissAll() {
    this._saveAlerts(this._getAlerts().map((a) => ({ ...a, dismissed: true })));
  },
};
