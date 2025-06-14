import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({
  path: './.env'
});

// const BASE_URL : string = process.env.USERMANAGEMENT_URL as string;
const BASE_URL = process.env.NODE_ENV == "production" ? "http://user-management:3000" : "http://localhost:3000";

export const getUsers = () => axios.get(`${BASE_URL}/users`);
export const getUserByUsername = (username: string) => axios.get(`${BASE_URL}/users/${username}`);

export const updateUser = (username: string, body: any) => axios.put(`${BASE_URL}/users/${username}`, body);
export const disableUser = (username: string) => axios.patch(`${BASE_URL}/users/${username}`);
export const deleteUser = (username: string) => axios.delete(`${BASE_URL}/users/${username}`);


export const login = (body: any) => axios.post(`${BASE_URL}/auth/login`, body)
export const register = (body: any) => axios.post(`${BASE_URL}/users`, body);