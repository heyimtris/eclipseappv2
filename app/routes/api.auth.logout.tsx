// log the user out by clearing their auth cookie
import { type LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export const loader: LoaderFunction = async ({ request }) => {
    const response = redirect("/auth/login");
    // Clear the auth cookie
    response.headers.append(
        "Set-Cookie",
        `authToken=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
    );
    return response;
}

export default function LogoutRoute() {
    return null; // No UI, API only
}