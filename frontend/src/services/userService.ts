import { BASE_URL } from "../config/config.js";
import { request, getHeaders } from "../utils/api.js";

const USER_BASE_URL = `${BASE_URL}/users`;

export interface User {
  id: string;
  username: string;
  email: string;
  active: boolean;
  createdAt: string;
}

// API functions
export const getUsers = () =>
  request<User[]>(`${USER_BASE_URL}/`, {
    method: "GET",
    headers: getHeaders(),
  });

export const getUserByUsername = (username: string) =>
  request<User>(`${USER_BASE_URL}/${username}`, {
    method: "GET",
    headers: getHeaders(),
  });

export const updateUser = (username: string, body: any) =>
  request<User>(`${USER_BASE_URL}/${username}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

export const disableUser = (username: string) =>
  request<User>(`${USER_BASE_URL}/${username}`, {
    method: "PATCH",
    headers: getHeaders(),
  });

export const deleteUser = (username: string) =>
  request<void>(`${USER_BASE_URL}/${username}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

