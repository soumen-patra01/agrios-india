/* Context engine — assembles everything the model should know about THIS
   farmer and THIS moment into one compact block for the system prompt. */

import { profileMemory } from "../memory/profileMemory.js";
import { memoryEngine } from "../memory/memoryEngine.js";
import { storage } from "../../utils/storage.js";

/* Indian cropping season from the calendar month. */
export function currentSeason(date = new Date()) {
  const m = date.getMonth() + 1;
  if (m >= 6 && m <= 10) return "kharif";
  if (m >= 11 || m <= 3) return "rabi";
  return "zaid";
}

export const contextEngine = {
  build({ convo } = {}) {
    const lines = [];
    const now = new Date();

    lines.push(`Date: ${now.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`);
    lines.push(`Season: ${currentSeason(now)}`);

    const profileBlock = profileMemory.toPromptBlock();
    if (profileBlock) lines.push(profileBlock);

    // Signed-in phone (UI-only auth for now) — presence only, never the number.
    const user = storage.get("user", null);
    if (user) lines.push("User is signed in to AgriOS.");

    if (convo) {
      const advice = memoryEngine.recentAdviceSummary(convo);
      if (advice) lines.push(`Your previous advice in this conversation (summary): ${advice}`);
    }

    return lines.join("\n");
  },
};
