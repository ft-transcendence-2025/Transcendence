import { BASE_URL } from "../config/config.js";

// Helper function to get headers with Authorization if token exists
export function getHeaders(contentType = "application/json") {
  const headers: Record<string, string> = {
    "Content-Type": contentType,
  };

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

let accessToken: string | null = localStorage.getItem("authToken");

export function setAccessToken(token: string) {
  accessToken = token;
  localStorage.setItem("authToken", token);
}
export function getAccessToken() {
  return accessToken ?? localStorage.getItem("authToken");
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include", // sends cookie with refresh token
    });
    console.log("API res para refresh: ", res);
    if (!res.ok) return false;

    const data = await res.json();
    if (data.accessToken) {
      setAccessToken(data.accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Generic request wrapper function
export async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  console.log("DEBUG: request wrapper called..");
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...getHeaders(),
    },
    credentials: "include", // important for cookies
  });

  if (response.status === 401) {
    console.log("DEBUG: PEDIDO COM STATUS 401, NAO AUTORIZADO..");
    const refreshed = await refreshAccessToken();
    console.log("resultado da chamada para o refreshToken: ", refreshed);
    if (refreshed) {
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          ...getHeaders(),
        },
        credentials: "include",
      });
    } else {
      throw new Error("Session expired. Please log in again.");
    }
  }

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } else {
        errorMessage = (await response.text()) || errorMessage;
      }
    } catch {}
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}
