import { BASE_URL } from "../config/config.js";
import { request, getHeaders } from "../utils/api.js";
import { getCurrentUser, getCurrentUsername } from "../utils/userUtils.js";

const FRIEND_BASE_URL = `${BASE_URL}/friendships`;
const USER_BASE_URL = `${BASE_URL}/users`;
const username = getCurrentUsername();

// API functions
export const getUserFriends = () =>
  request(`${FRIEND_BASE_URL}/list/${username}`, {
    method: "GET",
    headers: getHeaders(),
  });

// Fetch all users
export const getAllUsers = () =>
  request(`${USER_BASE_URL}/`, {
    method: "GET",
    headers: getHeaders(),
  });