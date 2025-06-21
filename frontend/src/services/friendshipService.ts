// import axios from "axios";
// import dotenv from 'dotenv';

// dotenv.config({
// 	path: './.env'
// });

// 	app.post('/', friendshipController.sendFriendRequest); // enviar pedido
// 	app.get('/requests/:userId', friendshipController.getFriendRequests); // ver pedidos recebidos
// 	app.patch('/respond/:friendshipId', friendshipController.respondToFriendRequest); // aceitar/rejeitar
// 	app.get('/list/:userId', friendshipController.listFriends); // listar amigos
// 	app.delete('/', friendshipController.removeFriend); // remover amizade

// const BASE_URL = process.env.NODE_ENV == "production" ? "http://user-management:3000/friendships" : "http://localhost:3000/friendships";

// const BASE_URL =
//   window.location.hostname === "localhost"
//     ? "http://localhost:3000/friendships"
//     : "http://user-management:3000/friendships";
// 
// export const sendFriendRequest = (body: any) => axios.post(`${BASE_URL}`, body);
// export const getFriendRequests = (username: string) =>
//   axios.get(`${BASE_URL}/requests/${username}`);
// export const listFriends = (username: string) =>
//   axios.get(`${BASE_URL}/list/${username}`);
// export const respondToFriendRequest = (friendshipId: string, body: any) =>
//   axios.patch(`${BASE_URL}/respond/${friendshipId}`, body);
// export const removeFriend = (body: any) => axios.delete(`${BASE_URL}`, body);
