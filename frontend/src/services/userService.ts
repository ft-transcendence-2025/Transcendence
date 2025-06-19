// import axios from 'axios';

const BASE_URL = 'https://localhost:5000/api/users';
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
	  name: string;
	  email: string;
	};
  }

// Set up an Axios instance
const api = axios.create({
  baseURL: BASE_URL,
});

// Add a request interceptor to include the token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Use the Axios instance for all requests
export const getUsers = () => api.get<User[]>(`/`);
export const getUserByUsername = (username: string) => api.get(`/${username}`);
export const updateUser = (username: string, body: any) => api.put(`/${username}`, body);
export const disableUser = (username: string) => api.patch(`/${username}`);
export const deleteUser = (username: string) => api.delete(`/${username}`);
export const login = (body: any) => api.post<LoginResponse>(`/login`, body);
export const register = (body: any) => api.post(`/`, body);