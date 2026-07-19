import { useState } from "react";
import Login from "./Login.jsx";
import OtpVerify from "./OtpVerify.jsx";

export default function AuthFlow() {
  const [phone, setPhone] = useState(null);

  if (phone) {
    return <OtpVerify phone={phone} onBack={() => setPhone(null)} />;
  }

  return <Login onNext={(ph) => setPhone(ph)} />;
}
