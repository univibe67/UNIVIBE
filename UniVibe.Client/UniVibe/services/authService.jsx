// services/authService.js
const BASE_URL = "http://10.0.2.2:5107/api/Auth"; // Sadece ana dizin

export const authService = {
  async login(email, password) {
    const response = await fetch(`${BASE_URL}/login`, {
      // Burası: .../api/Auth/login
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  async registerInit(email) {
    const response = await fetch(`${BASE_URL}/register-init`, {
      // Burası: .../api/Auth/register-init
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },
};

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Bir hata oluştu");
  return data;
}
