import type { Route } from "./+types/home";
import { AuthPage } from "../login/auth";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Eclipse" },
    { name: "shortcut icon", href: "/favicon.ico" },
    { name: "description", content: "Login or sign up for Eclipse!" }
  ];
}

export default function Auth() {
  return <AuthPage />;
}
