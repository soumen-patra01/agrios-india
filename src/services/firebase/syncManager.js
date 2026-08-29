import { fbEnabled } from "./config.js";
import { getAll, remove } from "./syncQueue.js";
import { preferences } from "../../customize/preferences.js";

/* The cloud stack — Firestore repo, cloud pull, migration, profile save and FCM
   — is unreachable until the user actually signs in or a queued write flushes,
   but AppStore imports this module on mount just to call initSync(). Static
   imports here therefore put the ~460kB Firestore chunk (and the notification
   stack behind fcmService) on the first-paint path of every session, including
   signed-out ones and builds with no Firebase project at all. Load them at the
   point of use instead. */

let _initialized = false;

/* Respect the user's offline preference — "off" keeps data on-device only. */
function cloudSyncEnabled() {
  return preferences.get("offline.mode", "auto") !== "off";
}

async function flushQueue() {
  if (!fbEnabled || !cloudSyncEnabled()) return;
  const pending = await getAll();
  // Nothing queued is the common case on an "online" event — return before
  // paying for the Firestore SDK.
  if (!pending.length) return;
  // Fetching the chunk can fail (flaky link right after an "online" event, cold
  // cache). Leave the queue intact and retry on the next flush rather than
  // rejecting into callers that don't await us.
  let cloudRepo;
  try { ({ repo: cloudRepo } = await import("./firestoreRepo.js")); }
  catch { return; }
  for (const entry of pending) {
    try {
      const r = cloudRepo(entry.storeName);
      if (entry.op === "add") await r.add(entry.data);
      else if (entry.op === "update") await r.update(entry.data.id, entry.data);
      else if (entry.op === "remove") await r.remove(entry.data.id);
      await remove(entry.id);
    } catch {}
  }
}

export function initSync() {
  if (_initialized || !fbEnabled) return;
  _initialized = true;
  window.addEventListener("online", () => { flushQueue().catch(() => {}); });
}

export async function onLogin(user) {
  if (!fbEnabled) return;
  const [{ saveProfile }, { pullFromCloud }, { migrateToFirestore }, { fcmService }] =
    await Promise.all([
      import("./userProfile.js"),
      import("./pullFromCloud.js"),
      import("./migrate.js"),
      import("../notifications/fcmService.js"),
    ]);
  saveProfile(user).catch(() => {});
  fcmService.requestToken()
    .then(() => fcmService.saveToken(user.uid))
    .catch(() => {});
  await pullFromCloud().catch(() => {});
  await migrateToFirestore().catch(() => {});
  await flushQueue().catch(() => {});
}

export async function onLogout() {
  // deleteToken() already no-ops without Firebase (getMessagingInstance returns
  // null before it touches storage), so skipping the import changes nothing but
  // the download. Callers don't await this, so it must never reject.
  if (!fbEnabled) return;
  try {
    const { fcmService } = await import("../notifications/fcmService.js");
    await fcmService.deleteToken();
  } catch { /* best-effort */ }
}

export async function pendingSyncCount() {
  try { return (await getAll()).length; } catch { return 0; }
}

export async function flushNow() {
  await flushQueue().catch(() => {});
  return pendingSyncCount();
}
