const API_BASE = (import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000").replace(/\/$/, "");

export function getToken() {
  // Access token хранится в браузере и нужен для защищенных backend endpoints.
  return localStorage.getItem("tk_access") || "";
}

export function setToken(access) {
  // После login сохраняем token, чтобы пользователь оставался авторизованным.
  localStorage.setItem("tk_access", access);
}

export function clearTokens() {
  // При logout или ошибочном token очищаем авторизацию.
  localStorage.removeItem("tk_access");
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  // Общая функция для всех HTTP запросов к backend.
  // Она добавляет headers, token, JSON body и обрабатывает ошибки.
  const headers = { "Content-Type": "application/json" };

  // Если endpoint защищен, добавляем JWT token.
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Failed to fetch (backend is not reachable / CORS)");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = data?.detail || `HTTP ${response.status}`;
    const message = Array.isArray(detail) ? detail.map((e) => e.msg).join("; ") : String(detail);
    throw new Error(message);
  }

  return data;
}

export const api = {
  // Здесь собраны короткие методы, чтобы в App.jsx не писать fetch вручную.
  config: () => request("/api/game/config"),
  register: (payload) => request("/api/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: payload }),
  me: () => request("/api/users/me", { auth: true }),
  saveResult: (payload) => request("/api/results", { method: "POST", body: payload, auth: true }),
  leaderboard: (mode_seconds, language, limit = 20) =>
    request(`/api/leaderboard?mode_seconds=${mode_seconds}&language=${language}&limit=${limit}`),
};
