import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FB_PROJECT_ID,
      clientEmail: process.env.FB_CLIENT_EMAIL,
      privateKey:  process.env.FB_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function verifyToken(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  try {
    return await getAuth().verifyIdToken(header.slice(7));
  } catch {
    return null;
  }
}
