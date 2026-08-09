function encodeB64(str: string): string {
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeB64(str: string): string {
  try {
    return decodeURIComponent(escape(atob(str.replace(/-/g, "+").replace(/_/g, "/"))));
  } catch {
    return str;
  }
}

export function encodeRoute(path: string): string {
  if (path === "/" || path === "") return "/";
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return "/";
  if (segments.length === 1) return "/" + encodeB64(segments[0]);
  return "/" + segments.map(encodeB64).join("/");
}

export function decodeRoute(path: string): string {
  if (path === "/" || path === "") return "/";
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return "/";
  return "/" + segments.map(decodeB64).join("/");
}

export const routes = {
  dashboard: "/",
  schedules: "/" + encodeB64("schedules"),
  files: "/" + encodeB64("files"),
  settings: "/" + encodeB64("settings"),
  logs: "/" + encodeB64("logs"),
  database: "/" + encodeB64("database"),
  docs: "/" + encodeB64("docs"),
};

export function decodePath(path: string): string {
  if (path === "/") return "/";
  return decodeRoute(path);
}
