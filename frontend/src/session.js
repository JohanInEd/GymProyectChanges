const sessionStorageKey = "gymflow-session";

export function loadSession() {
  try {
    const stored = JSON.parse(localStorage.getItem(sessionStorageKey) || "null");
    return stored && stored.token && stored.user ? stored : null;
  } catch {
    return null;
  }
}

export function saveSession(token, user) {
  localStorage.setItem(sessionStorageKey, JSON.stringify({ token, user }));
}

export function clearSession() {
  localStorage.removeItem(sessionStorageKey);
}
