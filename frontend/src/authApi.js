import { api } from "./apiClient.js";

function toAuthResult(result, fallbackMessage) {
  if (!result.ok) {
    return { ok: false, message: result.message || fallbackMessage };
  }

  return { ok: true, token: result.data.token, user: result.data.user };
}

function toMessageResult(result) {
  return {
    ok: result.ok,
    message: result.ok ? result.data?.message : result.message,
  };
}

export async function login(email, password) {
  const result = await api.post("/api/auth/login", { email, password });
  return toAuthResult(result, "Correo o contrasena incorrectos.");
}

export async function registerGym(form, code) {
  const result = await api.post("/api/auth/register-gym", {
    gymName: form.gymName,
    country: form.country,
    city: form.city,
    phone: form.phone,
    ownerName: form.ownerName,
    email: form.email,
    password: form.password,
    acceptTerms: form.acceptTerms,
    inviteCode: code,
    subscriptionPlan: form.subscriptionPlan,
  });
  return toAuthResult(result, "No se pudo registrar el gimnasio.");
}

export async function me() {
  const result = await api.get("/api/auth/me");
  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  return { ok: true, user: result.data };
}

export async function forgotPassword(email) {
  return toMessageResult(await api.post("/api/auth/forgot-password", { email }));
}

export async function resetPassword(token, password) {
  return toMessageResult(await api.post("/api/auth/reset-password", { token, password }));
}

export async function verifyEmail(token) {
  return toMessageResult(await api.post("/api/auth/verify-email", { token }));
}
