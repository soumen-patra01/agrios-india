/* Conversation persistence on top of the app's namespaced storage util.
   Index (light) and bodies (heavy) are stored separately so listing is cheap.

   Local-first: swaps to the backend API in a later phase without changing
   callers — keep this module's surface stable. */

import { storage } from "../../utils/storage.js";
import { LIMITS } from "../config.js";
import { newConversation, textOf } from "../models/message.js";

const INDEX_KEY = "ai:convos";
const bodyKey = (id) => `ai:convo:${id}`;

const readIndex = () => storage.get(INDEX_KEY, []);
const writeIndex = (idx) => storage.set(INDEX_KEY, idx);

export const conversationStore = {
  list() {
    return readIndex().sort((a, b) => (b.pinned - a.pinned) || (b.updatedAt - a.updatedAt));
  },

  get(id) {
    return storage.get(bodyKey(id), null);
  },

  create(agentId = null) {
    const convo = newConversation(agentId);
    storage.set(bodyKey(convo.id), convo);
    writeIndex([{ id: convo.id, title: "", agentId, pinned: false, updatedAt: convo.updatedAt }, ...readIndex()]);
    this.prune();
    return convo;
  },

  save(convo) {
    convo.updatedAt = Date.now();
    if (convo.messages.length > LIMITS.maxMessagesPerConvo) {
      convo.messages = convo.messages.slice(-LIMITS.maxMessagesPerConvo);
    }
    if (!convo.title) {
      const first = convo.messages.find((m) => m.role === "user");
      if (first) convo.title = textOf(first).slice(0, 60);
    }
    storage.set(bodyKey(convo.id), convo);
    writeIndex(readIndex().map((e) => e.id === convo.id
      ? { ...e, title: convo.title, agentId: convo.agentId, updatedAt: convo.updatedAt }
      : e));
  },

  setPinned(id, pinned) {
    writeIndex(readIndex().map((e) => (e.id === id ? { ...e, pinned } : e)));
    const body = this.get(id);
    if (body) { body.pinned = pinned; storage.set(bodyKey(id), body); }
  },

  remove(id) {
    storage.remove(bodyKey(id));
    writeIndex(readIndex().filter((e) => e.id !== id));
  },

  search(query) {
    const q = query.trim().toLowerCase();
    if (!q) return this.list();
    return this.list().filter((e) => {
      if (e.title.toLowerCase().includes(q)) return true;
      const body = this.get(e.id);
      return body?.messages.some((m) => textOf(m).toLowerCase().includes(q));
    });
  },

  /* Plain-text export for sharing. */
  exportText(id) {
    const convo = this.get(id);
    if (!convo) return "";
    const lines = convo.messages.map((m) =>
      `${m.role === "user" ? "You" : "AgriOS AI"}:\n${textOf(m)}\n`);
    return `AgriOS India — ${convo.title || "Conversation"}\n${new Date(convo.createdAt).toLocaleString()}\n\n${lines.join("\n")}`;
  },

  /* Keep the store bounded: drop oldest unpinned conversations. */
  prune() {
    const idx = readIndex();
    if (idx.length <= LIMITS.maxConversations) return;
    const removable = idx.filter((e) => !e.pinned).sort((a, b) => a.updatedAt - b.updatedAt);
    for (const e of removable.slice(0, idx.length - LIMITS.maxConversations)) this.remove(e.id);
  },
};
