import { useState } from "react";
import Login from "./Login.jsx";
import OtpVerify from "./OtpVerify.jsx";

/* Owns the phone → OTP two-step. Kept as one flow so Login and OTP stay
   independently reusable screens. */
export default function AuthFlow() {
  const [phone, setPhone] = useState(null);
  return phone
    ? <OtpVerify phone={phone} onBack={() => setPhone(null)} />
    : <Login onNext={setPhone} />;
}
