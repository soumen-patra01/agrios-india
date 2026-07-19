import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "./config.js";

const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function userCol(storeName) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return collection(db, "users", user.uid, storeName);
}

export function repo(storeName) {
  return {
    async add(data) {
      const id = data.id || uid();
      const record = { ...data, id, createdAt: new Date().toISOString() };
      await setDoc(doc(userCol(storeName), id), record);
      return record;
    },

    async getAll() {
      const snap = await getDocs(userCol(storeName));
      return snap.docs.map((d) => d.data());
    },

    async getBy(field, value) {
      const q = query(userCol(storeName), where(field, "==", value));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data());
    },

    async getById(id) {
      const snap = await getDoc(doc(userCol(storeName), id));
      return snap.exists() ? snap.data() : null;
    },

    async update(id, patch) {
      const ref = doc(userCol(storeName), id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      const updated = {
        ...snap.data(),
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(ref, updated);
      return updated;
    },

    async remove(id) {
      await deleteDoc(doc(userCol(storeName), id));
    },

    async count() {
      const snap = await getDocs(userCol(storeName));
      return snap.size;
    },
  };
}
