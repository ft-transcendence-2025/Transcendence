const BASE_URL = "https://localhost:5000/api/users";

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
export const getUsers = () =>
  request<User[]>("/", {
    method: "GET",
    headers: getHeaders(),
  });

export const getUserByUsername = (username: string) =>
  request<User>(`/${username}`);

export const updateUser = (username: string, body: any) =>
  request<User>(`/${username}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

export const disableUser = (username: string) =>
  request<User>(`/${username}`, {
    method: "PATCH",
    headers: getHeaders(),
  });

export const deleteUser = (username: string) =>
  request<void>(`/${username}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

//
//import axios from "axios";
//
//const BASE_URL = "https://localhost:5000/api/users";
//
//// Set up an Axios instance
//const api = axios.create({
//  baseURL: BASE_URL,
//});
//
//// Add a request interceptor to include the token
//api.interceptors.request.use((config) => {
//  const token = localStorage.getItem("authToken");
//  if (token) {
//    config.headers = config.headers || {};
//    config.headers["Authorization"] = `Bearer ${token}`;
//  }
//  return config;
//});
//
//// Use the Axios instance for all requests
//export const getUsers = () => api.get(`/`);
//export const getUserByUsername = (username: string) =>
//  api.get(`/${username}`);
//export const updateUser = (username: string, body: any) =>
//  api.put(`/${username}`, body);
//export const disableUser = (username: string) => api.patch(`/${username}`);
//export const deleteUser = (username: string) => api.delete(`/${username}`);
//export const login = (body: any) => api.post(`/login`, body);
//export const register = (body: any) => api.post(`/`, body);
