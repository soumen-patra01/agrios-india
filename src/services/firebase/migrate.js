import { collection, doc, setDoc } from "firebase/firestore";
import { db, auth } from "./config.js";
import { storage } from "../../utils/storage.js";

const MIGRATION_FLAG = "fb:migrated";

function readIdb(dbName, storeNames) {
  return new Promise((resolve) => {
    const req = indexedDB.open(dbName);
    req.onerror = () => resolve({});
    req.onsuccess = (e) => {
      const idb = e.target.result;
      const result = {};
      const existing = Array.from(idb.objectStoreNames);
      const toRead = storeNames.filter((s) => existing.includes(s));
      if (!toRead.length) { idb.close(); resolve(result); return; }

      const tx = idb.transaction(toRead, "readonly");
      let pending = toRead.length;
      for (const name of toRead) {
        const r = tx.objectStore(name).getAll();
        r.onsuccess = () => { result[name] = r.result || []; if (--pending === 0) { idb.close(); resolve(result); } };
        r.onerror   = () => { result[name] = [];             if (--pending === 0) { idb.close(); resolve(result); } };
      }
    };
  });
}

export async function migrateToFirestore() {
  if (storage.get(MIGRATION_FLAG)) return { skipped: true };
  const user = auth.currentUser;
  if (!user) return { skipped: true, reason: "not authenticated" };

  const erpStores = ["farms", "parcels", "tasks", "inventory", "stockMoves", "assets", "maintenance", "employees", "attendance", "contacts", "orders", "devices", "telemetry"];
  const livestockStores = ["animals", "productions", "events"];
  const marketStores = ["sellers", "products", "cart", "wishlist", "orders", "reviews"];

  const [erpData, livestockData, marketData] = await Promise.all([
    readIdb("agrios-erp", erpStores),
    readIdb("agrios-livestock", livestockStores),
    readIdb("agrios-marketplace", marketStores),
  ]);

  let total = 0;
  const userRoot = `users/${user.uid}`;

  const writeAll = async (data, renames = {}) => {
    for (const [storeName, records] of Object.entries(data)) {
      const colName = renames[storeName] || storeName;
      for (const record of records) {
        if (!record.id) continue;
        await setDoc(doc(collection(db, userRoot, colName), record.id), record);
        total++;
      }
    }
  };

  await writeAll(erpData);
  await writeAll(livestockData);
  await writeAll(marketData, { orders: "mpOrders" });

  const ledgerTxns = storage.get("ldg:txns", []);
  for (const txn of ledgerTxns) {
    if (!txn.id) continue;
    await setDoc(doc(collection(db, userRoot, "ledgerTxns"), txn.id), txn);
    total++;
  }

  storage.set(MIGRATION_FLAG, true);
  return { migrated: true, total };
}
