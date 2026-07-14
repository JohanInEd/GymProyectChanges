const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function postJson(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function validateInviteCode(code) {
  const result = await postJson("/api/invite-codes/validate", { code });
  return result.isValid;
}

export async function redeemInviteCode(code) {
  const result = await postJson("/api/invite-codes/redeem", { code });
  return { success: result.success, message: result.message };
}
