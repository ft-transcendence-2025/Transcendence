import { BASE_URL } from "../config/config.js";
import { request, getHeaders } from "../utils/api.js";

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
  token: string;
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
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

export const register = (body: any) =>
  request<User>(`${AUTH_BASE_URL}/register`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
