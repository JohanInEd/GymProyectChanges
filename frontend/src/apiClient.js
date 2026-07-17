const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

let authToken = null;
let unauthorizedHandler = null;

export function setAuthToken(token) {
  authToken = token || null;
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

async function request(method, path, body) {
  const headers = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return {
      ok: false,
      status: 0,
      message: "No se pudo conectar con el servidor. Intenta de nuevo.",
    };
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (response.status === 401) {
    unauthorizedHandler?.();
    return { ok: false, status: 401, message: "Tu sesion expiro. Inicia sesion de nuevo." };
  }

  if (!response.ok) {
    // The API returns plain-string bodies for expected errors.
    return {
      ok: false,
      status: response.status,
      message: typeof data === "string" && data ? data : "Ocurrio un error. Intenta de nuevo.",
    };
  }

  return { ok: true, status: response.status, data };
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  delete: (path) => request("DELETE", path),
};
