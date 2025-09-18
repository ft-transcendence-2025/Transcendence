import { BASE_URL } from "../config/config.js";
import { request, getHeaders } from "../utils/api.js";
import { getCurrentUsername } from "../utils/userUtils.js";

const AUTH_BASE_URL = `${BASE_URL}/auth`;

export interface User {
  id: string;
  username: string;
  email: string;
  active: boolean;
  createdAt: string;
}

interface LoginResponse {
  // export only if used in other files
  accessToken: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

// API functions
export const login = (body: any) =>
  request<LoginResponse>(`${AUTH_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export const register = (body: any) =>
  request<User>(`${AUTH_BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// 2FA functions
export const loginWith2FA = (body: any, token: string) =>
  request<LoginResponse>(`${AUTH_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, token }),
  });

export const generate2FA = () => {
  const username = getCurrentUsername();
  if (!username) throw new Error("User not authenticated");
  return request<{ qr: string; otpauthUrl: string }>(
    `${AUTH_BASE_URL}/${username}/2fa/generate`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({}),
    },
  );
};

export const enable2FA = (token: string) => {
  const username = getCurrentUsername();
  if (!username) throw new Error("User not authenticated");
  return request(`${AUTH_BASE_URL}/${username}/2fa/enable`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ token }),
  });
};

export const disable2FA = () => {
  const username = getCurrentUsername();
  if (!username) throw new Error("User not authenticated");
  return request(`${AUTH_BASE_URL}/${username}/2fa/disable`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({}),
  });
};
