const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");


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

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };

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
    // сеть/сервер недоступен/блок CORS
    throw new Error("Failed to fetch (backend is not reachable / CORS)");
  }

  // читаем ответ
  const ct = res.headers.get("content-type") || "";
  let data = null;

  if (ct.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await res.text();
      data = text ? { detail: text } : null;
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    let detail = data?.detail ?? `HTTP ${res.status}`;

    // FastAPI validation errors: detail is array
    if (Array.isArray(detail)) {
      detail = detail
        .map((e) => {
          const loc = Array.isArray(e.loc) ? e.loc.join(".") : "field";
          return `${loc}: ${e.msg}`;
        })
        .join("; ");
    }

    // if detail is object
    if (detail && typeof detail === "object") {
      detail = JSON.stringify(detail);
    }

    throw new Error(String(detail));
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
