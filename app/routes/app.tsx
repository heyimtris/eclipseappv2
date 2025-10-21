import { AppPage } from "../app/app";
import { loader } from "./app.loader";
import { useLoaderData } from "react-router";

export { loader };

export function meta() {
  return [
    { title: "Eclipse" },
    { name: "shortcut icon", href: "/favicon.ico" },
    { name: "description", content: "Welcome to Eclipse!" }
  ];
}

export default function AppRoute() {
  const { user, friends, conversations, messages, participants } = useLoaderData() as any;
  return <AppPage user={user} friends={friends} conversations={conversations} messages={messages} participants={participants} />;
}
