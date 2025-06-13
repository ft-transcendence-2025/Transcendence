import axios from 'axios';

const BASE_URL =
	process.env.NODE_ENV === 'production'
		? 'http://user-management:3000'
		: 'http://localhost:3001';

export const getUsers = () => axios.get(`${BASE_URL}/users`);
export const getUserByUsername = (id: string) => axios.get(`${BASE_URL}/users/${id}`);
export const loginUser = (body: any) => axios.post(`${BASE_URL}/auth/login`, body);