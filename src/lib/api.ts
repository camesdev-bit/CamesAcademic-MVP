import { auth } from "./firebase";
import { safeStorage } from "./storage";

async function waitForAuthReady() {
  if (typeof auth.authStateReady !== "function") return;
  try {
    await Promise.race([
      auth.authStateReady(),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  } catch {
    // Proceed cleanly even if auth initialization fails
  }
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    await waitForAuthReady();
    const headers = new Headers(init?.headers);
    const currentUser = auth.currentUser;
    if (!headers.has("x-user-id")) {
      const uid = currentUser?.uid || safeStorage.getItem("cames_user_id") || "usr-guest";
      headers.set("x-user-id", uid);
    }
    if (currentUser && !headers.has("Authorization")) {
      try {
        const token = await currentUser.getIdToken();
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      } catch {
        // Ignore transient token errors
      }
    }
    return fetch(input, { ...init, headers });
  } catch {
    return fetch(input, init);
  }
}
