import { chatManager } from "../app.js";
import { BASE_URL } from "../config/config.js";
import { request, getHeaders } from "../utils/api.js";
import { getCurrentUser, getCurrentUsername } from "../utils/userUtils.js";
import { Friend } from "../views/chat.js";

const FRIEND_BASE_URL = `${BASE_URL}/friendships`;
const USER_BASE_URL = `${BASE_URL}/users`;


export type FriendshipRequest = {
  fromUserId: string;
  toUserId: string;
}

export enum FriendshipStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  BLOCKED = "BLOCKED",
  DECLINED = "DECLINED",
}

// API functions
export const getUserFriends = () =>
request(`${FRIEND_BASE_URL}/list/${getCurrentUsername()}`, {
  method: "GET",
  headers: getHeaders(),
});

// Fetch all users
export const getAllUsers = () =>
  request(`${USER_BASE_URL}`, {
    method: "GET",
    headers: getHeaders(),
  });

export const sendFriendRequest = async (friendUsername: string) => {
  const response = await request(`${FRIEND_BASE_URL}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ fromUserId: getCurrentUsername(), toUserId: friendUsername }),
  }) as { message: string; friendshipId: string };
  const message = {
    kind: 'notification/new',
    type: 'FRIEND_REQUEST',
    friendshipId: response.friendshipId,
    senderId: getCurrentUsername(),
    recipientId: friendUsername,
    content: `${getCurrentUsername()} has sent you a friend request.`,
    ts: Date.now(),
  };
  chatManager.sendMessage(friendUsername, message);
  console.log("Friend request sent response:", message);

  return response;
};

export const getPendingRequests = () =>
  request(`${FRIEND_BASE_URL}/requests/${getCurrentUsername()}`, {
    method: "GET",
    headers: getHeaders(),
  });

export const respondRequest = (friendshipId: string, accept: FriendshipStatus) =>
  request(`${FRIEND_BASE_URL}/respond/${friendshipId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ status: accept }),
  });

export const removeFriend = (friendUsername: string) =>
  request(`${FRIEND_BASE_URL}/`, {
    method: "DELETE",
    headers: getHeaders(),
    body: JSON.stringify({ fromUserId: getCurrentUsername(), toUserId: friendUsername }),
  });

export const blockUser = (friendUsername: string) =>
  request(`${FRIEND_BASE_URL}/block/${friendUsername}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ blockedBy: getCurrentUsername() }),
  });

  export const unblockUser = (friendUsername: string) =>
    request(`${FRIEND_BASE_URL}/unblock/${friendUsername}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ unblockedBy: getCurrentUsername() }),
    });

export const getFriendshipStatus = (friendUsername: string) =>
  request(`${FRIEND_BASE_URL}/status/${getCurrentUsername()}/${friendUsername}`, {
    method: "GET",
    headers: getHeaders()

  });