import { useState } from "react";
import Login from "./Login.jsx";
import OtpVerify from "./OtpVerify.jsx";

export default function AuthFlow() {
  const [auth, setAuth] = useState({ phone: null, token: null, isDemo: false });

  if (auth.phone) {
    return (
      <OtpVerify
        phone={auth.phone}
        token={auth.token}
        isDemo={auth.isDemo}
        onBack={() => setAuth({ phone: null, token: null, isDemo: false })}
      />
    );
  }

  return (
    <Login onNext={(phone, token, isDemo) => setAuth({ phone, token, isDemo })} />
  );
}
