// import axios from "axios";
// import dotenv from 'dotenv';

// dotenv.config({
// 	path: './.env'
// });

// const BASE_URL = process.env.NODE_ENV == "production" ? "http://user-management:3000/profiles" : "http://localhost:3000/profiles";

// const BASE_URL =
//   window.location.hostname === "localhost"
//     ? "http://localhost:3000/profiles"
//     : "http://user-management:3000/profiles";
// 
// export const createProfile = (username: string, body: any) =>
//   axios.post(`${BASE_URL}/${username}`, body);
// export const getProfileByUsername = (username: string) =>
//   axios.get(`${BASE_URL}/${username}`);
// export const updateProfile = (username: string, body: any) =>
//   axios.put(`${BASE_URL}/${username}`, body);
// export const deleteProfile = (username: string) =>
//   axios.delete(`${BASE_URL}/${username}`);
