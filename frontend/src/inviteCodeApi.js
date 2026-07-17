import { api } from "./apiClient.js";

export async function validateInviteCode(code) {
  const result = await api.post("/api/invite-codes/validate", { code });
  if (!result.ok) {
    throw new Error(result.message);
  }

  return result.data.isValid;
}
