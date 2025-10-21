import { Button } from "../components/button";
import { Input } from "../components/input";
import { Alert } from "../components/alert";
import logoLight from "../assets/logo-light.png";
import logoDark from "../assets/logo-dark.png";
import React, { useState, useRef } from "react";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import "./signup-step-transition.css";

export function SignupPage({ switchToLogin }: { switchToLogin?: () => void }) {
  // 2FA temporarily disabled
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: "",
  code: "",
    username: "",
    password: "",
    confirmPassword: ""
  });
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const nodeRef = useRef<HTMLDivElement>(null);

  // Simulated email check (replace with API call)
  const usedEmails = ["test@example.com", "user@domain.com"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setAlertMsg(null);
  };

  const validateStep = () => {
    if (step === 1) {
      if (usedEmails.includes(form.email.trim().toLowerCase())) {
        setAlertMsg("That email is already in use.");
        return false;
      }
    }
    if (step === 3) {
      const username = form.username.trim();
      const usernameRegex = /^[a-z0-9]{3,12}$/;
      if (!usernameRegex.test(username)) {
        setAlertMsg("Username must be 3-12 lowercase letters or numbers, no spaces.");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep((s) => Math.min(s + 1, 3));
    }
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth?intent=signup", {
        method: "POST",
        body: new URLSearchParams({
          email: form.email,
          username: form.username,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setAlertMsg(data.error || "Signup failed");
        return;
      }
      window.location.href = '/app';
    } catch (err) {
      setAlertMsg("Network error. Please try again.");
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
          <span className="block w-full text-2xl text-gray-700 dark:text-gray-200 text-center font-bold mx-auto md:hidden">
            messaging made <span className="text-purple-400">easier.</span>
          </span>
        </div>
        {/* Centered signup card */}
        <div className="flex min-h-[60vh] w-full items-center justify-center">
          <nav className="w-full max-w-md rounded-3xl bg-gray-850 dark:bg-gray-950 p-8 login-cont space-y-4">
            <form className="space-y-2 w-full flex flex-col" onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}>
              <div className="flex flex-col gap-1 pb-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-left m-0">
                  {step === 1 && "Signup"}
                  {step === 2 && "Make Eclipse yours!"}
                  {step === 3 && "Almost done!"}
                </h2>
                <p className="text-left text-sm text-gray-600 dark:text-gray-400 w-full m-0">
                  {step === 1 && "welcome! let's get started."}
                  {step === 2 && "enter your details"}
                  {step === 3 && (
                    <>
                      this is it!<br />
                      <i className="font-light" style={{ fontSize: "10px" }}>you can change any details here after signing up.</i>
                      <br />
                    </>
                  )}
                </p>
              </div>
              {alertMsg && ((step === 1 && alertMsg.includes('email')) || (step === 3 && alertMsg.includes('Username')))
                ? <Alert type="error" className="max-w-md mx-auto mb-4">{alertMsg}</Alert>
                : null}
              <SwitchTransition mode="out-in">
                <CSSTransition
                  key={step}
                  timeout={300}
                  classNames="fade-step"
                  nodeRef={nodeRef}
                >
                  <StepContent
                    nodeRef={nodeRef}
                    step={step}
                    form={form}
                    handleChange={handleChange}
                    prevStep={prevStep}
                    codeDigits={[]}
                    handleCodeDigitChange={() => {}}
                    codeInputRefs={[]}
                  />
                </CSSTransition>
              </SwitchTransition>
            </form>
            {step === 1 && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                Already have an account?
                <Button variant="text" className="w-auto" type="button" onClick={switchToLogin}>
                  Login
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </main>
  );
}



interface StepContentProps {
  nodeRef: React.RefObject<HTMLDivElement | null>;
  step: number;
  form: {
    email: string;
    code: string;
    username: string;
    password: string;
    confirmPassword: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  prevStep: () => void;
  codeDigits: string[];
  handleCodeDigitChange: (idx: number, value: string) => void;
  codeInputRefs: React.RefObject<HTMLInputElement | null>[];
}

function StepContent({ nodeRef, step, form, handleChange, prevStep, codeDigits, handleCodeDigitChange, codeInputRefs }: StepContentProps) {
  return (
    <div ref={nodeRef} className="flex flex-col gap-2 text-center justify-center w-full align-center">
      {step === 1 && (
        <>
          <Input label="Email" type="email" name="email" className="w-full" value={form.email} onChange={handleChange} required />
          <div className="flex gap-2 justify-center">
            <Button className="w-full" variant="primary" type="submit">
              Continue →
            </Button>
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <Input label="Username" type="text" name="username" className="w-full" value={form.username} onChange={handleChange} required />
          <Input label="Password" type="password" name="password" className="w-full" value={form.password} onChange={handleChange} required />
          <Input label="Confirm Password" type="password" name="confirmPassword" className="w-full" value={form.confirmPassword} onChange={handleChange} required />
          <div className="flex gap-2 pt-2 justify-center">
            <Button variant="text" type="button" onClick={prevStep}>
              ← Back
            </Button>
            <Button variant="primary" type="submit">
              Continue →
            </Button>
          </div>
        </>
      )}
      {step === 3 && (
        <>
          <div className="space-y-2">
            <div className="text-left text-gray-700 dark:text-gray-200">
              <div><strong>Email:</strong> {form.email}</div>
              <div><strong>Username:</strong> {form.username}</div>
            </div>
          </div>
          <div className="flex pt-2 gap-2 justify-center">
            <Button variant="text" type="button" onClick={prevStep}>
              ← Back
            </Button>
            <Button variant="primary" type="submit">
              Sign Up
            </Button>
          </div>
        </>
      )}
    </div>
  );
}