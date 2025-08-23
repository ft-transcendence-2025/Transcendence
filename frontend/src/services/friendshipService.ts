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

