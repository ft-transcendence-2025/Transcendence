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

  await request(`${BASE_URL}/${username}/avatar`, {
    method: "POST",
    headers: getHeaders(),
    body: formData,
  });
}
