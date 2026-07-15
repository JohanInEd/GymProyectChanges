const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function postJson(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { ok: response.ok, data };
}

function toResult({ ok, data }, fallbackMessage) {
  if (!ok) {
    return { ok: false, message: typeof data === "string" ? data : fallbackMessage };
  }

  return { ok: true, token: data.token, user: data.user };
}

export async function login(email, password) {
  const response = await postJson("/api/auth/login", { email, password });
  return toResult(response, "Correo o contrasena incorrectos.");
}

export async function registerGym(form, code) {
  const response = await postJson("/api/auth/register-gym", {
    gymName: form.gymName,
    city: form.city,
    phone: form.phone,
    ownerName: form.ownerName,
    email: form.email,
    password: form.password,
    acceptTerms: form.acceptTerms,
    inviteCode: code,
  });
  return toResult(response, "No se pudo registrar el gimnasio.");
}
