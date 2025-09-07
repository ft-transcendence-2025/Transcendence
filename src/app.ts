// src/app.ts
import Fastify from "fastify";
import dotenv from "dotenv";
import authPlugin from "./plugins/auth";
import authorizePlugin from "./plugins/authorize";
import userProxy from "./routes/user.proxy";
import profileProxy from "./routes/profile.proxy";
import friendshipProxy from "./routes/friendship.proxy";
import authRoutes from "./routes/auth.routes";
import chatProxy from "./routes/chat.proxy";
import metrics from "fastify-metrics";
import fastifyCookie from "@fastify/cookie";
import blockchainProxy from "./routes/blockchain.proxy";
import gameProxy from "./routes/game.proxy";
// import chatRoutes from './routes/chat';
// import gameRoutes from './routes/game';

dotenv.config({
  path: "./.env",
});

const envToLogger = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      },
    },
  },
  production: true,
  test: false,
};

type Environment = "development" | "production" | "test";
const environment = (process.env.NODE_ENV as Environment) || "development";

const app = Fastify({ logger: envToLogger[environment] ?? true });
app.register(fastifyCookie);
app.register(authPlugin);
app.register(authorizePlugin);
app.register(metrics);

const routes = [
  { plugin: profileProxy },
  { plugin: friendshipProxy },
  { plugin: authRoutes },
  { plugin: userProxy },
  { plugin: chatProxy },
  { plugin: blockchainProxy },
  { plugin: gameProxy },
];

routes.forEach((route) => {
  app.register(route.plugin);
});

export default app;
