import { getIdToken } from "./auth.js";

export async function authFetch(url, options = {}) {
  const token = await getIdToken();
  const headers = { ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}
