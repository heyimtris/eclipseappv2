import { Button } from "../components/button";
import { Input } from "../components/input";
import logoLight from "../assets/logo-light.png";
import logoDark from "../assets/logo-dark.png";
import React, { useState, useRef } from "react";

export function LoginPage({ switchToSignup }: { switchToSignup?: () => void }) {
  const [dbStatus, setDbStatus] = useState<
    | null
    | { ok: boolean; error?: string; source?: string; db?: string }
  >(null);
  const checkDb = async () => {
    setDbStatus(null);
    try {
      const res = await fetch("/api/dbcheck");
      // try to parse JSON; if it fails, mark as error
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // ignore
      }
      setDbStatus(data ?? { ok: false, error: "Unexpected response" });
    } catch (e) {
      setDbStatus({ ok: false, error: "Network error" });
    }
  };
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: "",
    password: "",
    code: ""
  });
  const nodeRef = useRef<HTMLDivElement>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setAlertMsg(null);
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!form.email || !form.email.includes("@")) {
        setAlertMsg("Please enter a valid email address.");
        return;
      }
      setStep(2);
  } else if (step === 2) {
      if (!form.password) {
        setAlertMsg("Please enter your password.");
        return;
      }
      try {
        const res = await fetch("/api/auth?intent=login", {
          method: "POST",
          body: new URLSearchParams({ email: form.email, password: form.password }),
        });
        let data: any = null;
        let text: string | null = null;
        try {
          data = await res.clone().json();
        } catch {
          try {
            text = await res.text();
          } catch {}
        }
        const ok = data?.ok ?? res.ok;
        if (!ok) {
          if (res.status === 404 || data?.code === "USER_NOT_FOUND") {
            setAlertMsg("This email isn't on our systems!");
            return;
          }
          if (res.status === 401 || data?.code === "INVALID_PASSWORD") {
            setAlertMsg("Oops! The password entered doesn't match ours; try another.");
            return;
          }
          if (res.status === 400) {
            setAlertMsg(data?.error || "Invalid input. Please check your email and password.");
            return;
          }
          setAlertMsg(data?.error || text || "Login failed");
          return;
        }
        // 2FA disabled: success redirects directly
        window.location.href = '/app';
      } catch (err) {
        setAlertMsg("Network error. Please try again.");
      }
    }
  };

  return (
  <main className="flex flex-col justify-center align-center items-center min-h-screen p-4 md:p-0 w-full m-0 relative overflow-hidden">
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none",
          background: `url('/loginbackground.jpg') center center / cover no-repeat`,
          opacity: 0.3,
        }}
      />
      <div style={{ position: "relative", zIndex: 1, width: "100%", height: '100%' }}>
        {/* Top center: logo and welcome text */}
        <div className="w-full flex flex-col items-center justify-center pt-12 pb-4">
          <div className="w-[200px] md:w-[120px] max-w-[100vw] p-2 mx-auto flex justify-center items-center text-center">
            <img src={logoLight} alt="Eclipse" className="block w-full dark:hidden" />
            <img src={logoDark} alt="Eclipse" className="hidden w-full dark:block" />
          </div>
          <span className="w-full flex flex-row text-center align-center justify-center gap-1 text-2xl text-gray-700 dark:text-gray-200 text-center font-bold mx-auto md:hidden">
            messaging made <p className="text-purple-400">easier.</p>
          </span>
        </div>
        {/* Centered login card */}
        <div className="flex min-h-[60vh] w-full items-center justify-center">
          <nav className="w-full max-w-md rounded-3xl bg-gray-850 dark:bg-gray-950 p-8 login-cont space-y-4">
            <form className="space-y-2 w-full flex flex-col" onSubmit={handleNext}>
              <div className="flex flex-row gap-2 items-center mb-2">
                <Button type="button" variant="secondary" className="text-xs px-2 py-1" onClick={checkDb}>
                  Check DB Connection
                </Button>
                {dbStatus && (
                  dbStatus.ok
                    ? <span className="text-green-600 text-xs">Connected</span>
                    : <span className="text-red-500 text-xs">{dbStatus.error || "Not connected"}</span>
                )}
              </div>
              <div className="flex flex-col gap-1 pb-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-left m-0">
                  Login
                </h2>
                <p className="text-left text-sm text-gray-600 dark:text-gray-400 w-full m-0">
                  {step === 1 && "Enter your email to continue."}
                  {step === 2 && "Enter your password."}
                </p>
              </div>
              {alertMsg && (
                <div className="max-w-md mx-auto mb-4 text-red-500 text-sm text-center">{alertMsg}</div>
              )}
              {step === 1 && (
                <Input label="Email" type="email" name="email" className="w-full" value={form.email} onChange={handleChange} required />
              )}
              {step === 2 && (
                <Input label="Password" type="password" name="password" className="w-full" value={form.password} onChange={handleChange} required />
              )}
              {false && (
                <Input label="2FA Code" type="text" name="code" className="w-full tracking-widest text-center" maxLength={6} value={form.code} onChange={handleChange} required autoFocus />
              )}
              <div className="flex flex-row gap-2 justify-center pt-2 align-center h-auto justify-between">
                {step === 2 && (
                  <Button variant="text" type="button" onClick={() => setStep(1)}>
                    ← Back
                  </Button>
                )}
                {false && (
                  <Button variant="text" type="button" onClick={() => setStep(2)}>
                    ← Back
                  </Button>
                )}
                <Button variant="primary" type="submit" className="w-full">
                  {step === 1 ? "Continue →" : "Login"}
                </Button>
              </div>
            </form>
            <div className="text-sm text-gray-600 dark:text-gray-400 mr-2">
              Don't have an account?
              <Button variant="text" className="w-auto" type="button" onClick={switchToSignup}>
                Sign up
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </main>
  );
}