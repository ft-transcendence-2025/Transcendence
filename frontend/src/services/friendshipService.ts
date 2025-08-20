import { BASE_URL } from "../config/config.js";
import { request, getHeaders } from "../utils/api.js";
import { getCurrentUser, getCurrentUsername } from "../utils/userUtils.js";

const USER_BASE_URL = `${BASE_URL}/friendships`;
const username = getCurrentUsername();

// API functions
export const getUserFriends = () =>
  request(`${USER_BASE_URL}/list/${username}`, {
    method: "GET",
    headers: getHeaders(),
  });

// export const getUserByUsername = (username: string) =>
//   request(`${USER_BASE_URL}/${username}`);

// export const updateUser = (username: string, body: any) =>
//   request(`${USER_BASE_URL}/${username}`, {
//     method: "PUT",
//     headers: getHeaders(),
//     body: JSON.stringify(body),
//   });

// export const disableUser = (username: string) =>
//   request(`${USER_BASE_URL}/${username}`, {
//     method: "PATCH",
//     headers: getHeaders(),
//   });

// export const deleteUser = (username: string) =>
//   request<void>(`${USER_BASE_URL}/${username}`, {
//     method: "DELETE",
//     headers: getHeaders(),
//   });

