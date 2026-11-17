import { createApiApp } from "./_bundle.mjs";

let cachedApp = null;

export default function handler(req, res) {
  if (!cachedApp) {
    cachedApp = createApiApp();
  }
  return cachedApp(req, res);
}
