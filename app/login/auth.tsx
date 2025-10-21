import React, { useState, useRef } from "react";
import { LoginPage } from "./login";
import { SignupPage } from "./signup";
import { SwitchTransition, CSSTransition } from "react-transition-group";
import "../components/auth-fade.css";

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <main className="flex flex-col min-h-screen w-full m-0 relative overflow-hidden">
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
        <SwitchTransition mode="out-in">
          <CSSTransition
            key={mode}
            nodeRef={nodeRef}
            timeout={350}
            classNames="auth-fade"
          >
            <div ref={nodeRef} className="w-full h-full">
              {mode === "login" ? (
                <LoginPage switchToSignup={() => setMode("signup")}/>
              ) : (
                <SignupPage switchToLogin={() => setMode("login")}/>
              )}
            </div>
          </CSSTransition>
        </SwitchTransition>
      </div>
    </main>
  );
}
