import Fastify from "fastify";
import WebSocket, { WebSocketServer } from 'ws'
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { routes } from "./routes.js";
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SocketConn } from "./websocket.js";


const __dirname = dirname(fileURLToPath(import.meta.url));

const fastify = Fastify({
  logger: {
    level: "info",
    file: "./log/server.log",
  }
});

fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../public'),
  prefix: '/',
})

const server = fastify.server;
const wss = new WebSocketServer({ server });

fastify.register(routes);

fastify.listen({ port: 6969, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  console.log("Listening on:", address);
})

const socketConne = new SocketConn(wss);
