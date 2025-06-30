const BASE_URL = "https://localhost:5000/api/auth";

export interface User {
  id: string;
  username: string;
  email: string;
  active: boolean;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

// Helper function to get headers with Authorization if token exists
function getHeaders(contentType = "application/json") {
  const headers: Record<string, string> = {
    "Content-Type": contentType,
  };
  const token = localStorage.getItem("authToken");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Generic request wrapper function
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(BASE_URL + path, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

// API functions

export const login = (body: any) =>
  request<LoginResponse>("/login", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

export const register = (body: any) =>
  request<User>("/register", {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
