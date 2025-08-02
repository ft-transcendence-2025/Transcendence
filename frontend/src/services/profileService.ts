const BASE_URL = "https://localhost:5000/api/profiles";
import { request, getHeaders } from "../utils/api.js";

export interface UserProfile {
  id: string;
  userUsername: string;
  status: "ONLINE" | "OFFLINE" | "IN_GAME";
  bio?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  nickName?: string;
  firstName?: string;
  lastName?: string;
  language?: "ENGLISH" | "PORTUGUESE";
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfileRequest {
  bio?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  nickName?: string;
  firstName?: string;
  lastName?: string;
  language?: "ENGLISH" | "PORTUGUESE";
}

// Profile API functions
export const createProfile = async (
  username: string,
  profileData: CreateProfileRequest,
): Promise<UserProfile> => {
  return request<UserProfile>(`${BASE_URL}/${username}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(profileData),
  });
};

export const getProfileByUsername = async (
  username: string,
): Promise<UserProfile> => {
  return request<UserProfile>(`${BASE_URL}/${username}`, {
    method: "GET",
    headers: getHeaders(),
  });
};

// Avatar has a separate path /profiles/:username/avatar
export const getUserAvatar = (username: string): string => {
  return `${BASE_URL}/${username}/avatar`;
};

export const saveUserAvatar = async (
  username: string,
  avatarFile: File,
): Promise<void> => {
  const formData = new FormData();
  formData.append("avatar", avatarFile);

  // Only include Authorization header for file uploads, let browser set Content-Type (for multipart)
  const headers: Record<string, string> = {};
  const token = localStorage.getItem("authToken");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  await request(`${BASE_URL}/${username}/avatar`, {
    method: "POST",
    headers: headers,
    body: formData,
  });
};

// Available avatars from assets
export const JUNGLE_AVATARS = [
  "bear.png",
  "cat.png", 
  "chicken.png",
  "dog.png",
  "gorilla.png",
  "koala.png",
  "meerkat.png",
  "panda.png",
  "rabbit.png",
  "sloth.png",
];

// Helper function to convert preset avatar to File object for upload
/* export const getPresetAvatarFile = async (avatarName: string): Promise<File> => {
  const response = await fetch(`/assets/avatars/${avatarName}`);
  const blob = await response.blob();
  return new File([blob], avatarName, { type: blob.type });
}; */
