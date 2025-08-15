import { BASE_URL } from "../config/config.js";
import { request, getHeaders } from "../utils/api.js";

const PROFILE_BASE_URL = `${BASE_URL}/profiles`;

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
  return request<UserProfile>(`${PROFILE_BASE_URL}/${username}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(profileData),
  });
};

export const getProfileByUsername = async (
  username: string,
): Promise<UserProfile> => {
  return request<UserProfile>(`${PROFILE_BASE_URL}/${username}`, {
    method: "GET",
    headers: getHeaders(),
  });
};

export const updateProfile = async (
  username: string,
  profileData: Partial<CreateProfileRequest>,
): Promise<UserProfile> => {
  return request<UserProfile>(`${PROFILE_BASE_URL}/${username}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(profileData),
  });
};

// Avatar has a separate path /profiles/:username/avatar
export const getUserAvatar = (username: string): string => {
  return `${PROFILE_BASE_URL}/${username}/avatar`;
};

export const saveUserAvatar = async (
  username: string,
  avatarFile: File,
): Promise<void> => {
  const formData = new FormData();
  formData.append("avatar", avatarFile);

  const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // use fetch directly for file uploads to avoid issues with content-type header
  const response = await fetch(`${PROFILE_BASE_URL}/${username}/avatar`, {
    method: "POST",
    headers: headers, // Only Authorization header, no Content-Type
    body: formData,
    credentials: "include",
  });

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

// Helper function to convert jungle avatar to File object for upload
export const getJungleAvatarFile = async (
  avatarName: string,
): Promise<File> => {
  const response = await fetch(`/assets/avatars/${avatarName}`);
  const blob = await response.blob();
  return new File([blob], avatarName, { type: blob.type });
};
