export const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, { token, method = "GET", body } = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with ${response.status}`);
  }

  return data;
}

export function getHealth() {
  return request("/health");
}

export function registerUser(body) {
  return request("/api/auth/register", { method: "POST", body });
}

export function loginUser(body) {
  return request("/api/auth/login", { method: "POST", body });
}

export function searchWorkspace(query, token) {
  return request(`/api/search?q=${encodeURIComponent(query)}`, { token });
}

export function getNotifications(token) {
  return request("/api/notifications", { token });
}
