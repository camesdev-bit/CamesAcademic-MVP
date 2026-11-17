import { auth } from "./firebase";
import { safeStorage } from "./storage";

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
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
