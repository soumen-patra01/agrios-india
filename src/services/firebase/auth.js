import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  TwitterAuthProvider,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth } from "./config.js";

let recaptchaVerifier = null;
let confirmationResult = null;

/* ── Phone OTP ───────────────────────────────────────────────────────────── */

export function setupRecaptcha(elementId) {
  if (recaptchaVerifier) recaptchaVerifier.clear();
  recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
    size: "invisible",
  });
  return recaptchaVerifier;
}

export async function sendOtp(phone) {
  if (!recaptchaVerifier) throw new Error("Call setupRecaptcha first");
  confirmationResult = await signInWithPhoneNumber(
    auth,
    "+91" + phone,
    recaptchaVerifier,
  );
  return { sent: true };
}

export async function verifyOtp(code) {
  if (!confirmationResult) throw new Error("Call sendOtp first");
  const result = await confirmationResult.confirm(code);
  return result.user;
}

/* ── Email / Password ────────────────────────────────────────────────────── */

export async function signInWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (err) {
    if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result.user;
    }
    throw err;
  }
}

/* ── Social providers ────────────────────────────────────────────────────── */

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  return result.user;
}

export async function signInWithFacebook() {
  const result = await signInWithPopup(auth, new FacebookAuthProvider());
  return result.user;
}

export async function signInWithApple() {
  const result = await signInWithPopup(auth, new OAuthProvider("apple.com"));
  return result.user;
}

export async function signInWithTwitter() {
  const result = await signInWithPopup(auth, new TwitterAuthProvider());
  return result.user;
}

/* ── Common ──────────────────────────────────────────────────────────────── */

export function onAuthChange(cb) {
  return onAuthStateChanged(auth, cb);
}

export async function getIdToken() {
  const user = auth.currentUser;
  return user ? user.getIdToken() : null;
}

export function logout() {
  return signOut(auth);
}
