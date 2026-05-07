function getDefaultApiBase() {
  const { protocol, hostname } = window.location;

  if (hostname === "webproject.id.lv" || hostname === "www.webproject.id.lv") {
    return `${protocol}//api.webproject.id.lv`;
  }

  if (hostname === "api.webproject.id.lv") {
    return window.location.origin;
  }

  return "http://localhost:8000";
}

const API_BASE = (import.meta.env.VITE_API_BASE || getDefaultApiBase()).replace(/\/$/, "");

export function getToken() {
  return localStorage.getItem("tk_access") || "";
}

export function setTokens(access, refresh) {
  localStorage.setItem("tk_access", access);
  localStorage.setItem("tk_refresh", refresh);
}

export function clearTokens() {
  localStorage.removeItem("tk_access");
  localStorage.removeItem("tk_refresh");
}

async function readBody(res) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json().catch(() => null);

  const text = await res.text().catch(() => "");
  return text ? { detail: text } : null;
}

function getErrorMessage(data, status) {
  const detail = data?.detail ?? `HTTP ${status}`;

  // FastAPI validation errors приходят массивом по полям формы.
  if (Array.isArray(detail)) {
    return detail.map((e) => `${e.loc?.join(".") || "field"}: ${e.msg}`).join("; ");
  }

  return typeof detail === "object" ? JSON.stringify(detail) : String(detail);
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };

  // Защищенные REST endpoints получают JWT через Authorization header.
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Failed to fetch (backend is not reachable / CORS)");
  }

  const data = await readBody(res);

  if (!res.ok) {
    throw new Error(getErrorMessage(data, res.status));
  }

  return data;
}

export const api = {
  config: () => request("/api/game/config"),
  register: (payload) => request("/api/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: payload }),
  me: () => request("/api/users/me", { auth: true }),
  saveResult: (payload) => request("/api/results", { method: "POST", body: payload, auth: true }),
  leaderboard: (mode_seconds, language, limit = 20) =>
    request(`/api/leaderboard?mode_seconds=${mode_seconds}&language=${language}&limit=${limit}`),
};
