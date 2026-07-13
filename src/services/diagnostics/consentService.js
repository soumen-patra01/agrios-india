/* Consent service — DPDP Act (India) and GDPR-ready consent management.
   Consent is stored locally; no data leaves the device without it. */

import { storage } from "../../utils/storage.js";

const CONSENT_KEY     = "diagnostics:consent";
const CONSENT_VERSION = "1.0";
const RETENTION_DAYS  = 365;

const EMPTY_CONSENT = {
  imageProcessing: false,
  dataRetention:   false,
  locationSharing: false,
  aiAnalysis:      false,
  consentDate:     null,
  version:         CONSENT_VERSION,
};

export const consentService = {
  get() {
    return storage.get(CONSENT_KEY, { ...EMPTY_CONSENT });
  },

  hasAll() {
    const c = this.get();
    return !!(c.imageProcessing && c.dataRetention && c.aiAnalysis);
  },

  grantAll() {
    const consent = {
      imageProcessing: true,
      dataRetention:   true,
      locationSharing: true,
      aiAnalysis:      true,
      consentDate:     new Date().toISOString(),
      version:         CONSENT_VERSION,
    };
    storage.set(CONSENT_KEY, consent);
    return consent;
  },

  update(patch) {
    const current = this.get();
    const updated = { ...current, ...patch, updatedAt: new Date().toISOString() };
    storage.set(CONSENT_KEY, updated);
    return updated;
  },

  revoke() {
    storage.set(CONSENT_KEY, { ...EMPTY_CONSENT });
  },

  isExpired() {
    const c = this.get();
    if (!c.consentDate) return true;
    const ageMs = Date.now() - new Date(c.consentDate).getTime();
    return ageMs > RETENTION_DAYS * 86400 * 1000;
  },

  getRetentionPolicy() {
    return {
      retentionDays: RETENTION_DAYS,
      dataTypes: ["Farm images (processed locally)", "Diagnosis records", "Symptom inputs", "GPS coordinates (optional)"],
      purpose: "Agricultural health diagnostics and personalized recommendations",
      controller: "AgriOS India — Local Device Storage",
      rights: ["Access your data", "Delete your data at any time", "Export your records", "Withdraw consent"],
      lawfulBasis: "Consent (DPDP Act 2023, Section 6)",
    };
  },
};
