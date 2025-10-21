import React, { useRef } from "react";
import { useLocation } from "react-router-dom";
import { SwitchTransition, CSSTransition } from "react-transition-group";
import "./auth-fade.css";

export function AuthContainer({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <SwitchTransition mode="out-in">
      <CSSTransition
        key={location.pathname}
        nodeRef={nodeRef}
        timeout={350}
        classNames="auth-fade"
      >
        <div ref={nodeRef} className="w-full h-full">
          {children}
        </div>
      </CSSTransition>
    </SwitchTransition>
  );
}
