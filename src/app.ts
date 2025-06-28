// src/app.ts
import Fastify from "fastify";
import dotenv from "dotenv";
import authPlugin from "./plugins/auth";
import authorizePlugin from "./plugins/authorize";
import userRoutes from "./routes/user.routes";
import profileRoutes from "./routes/profile.routes";
import friendshipRoutes from "./routes/friendship.routes";
import authRoutes from "./routes/auth.routes";
import metrics from "fastify-metrics";

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

// 📌 Registro dos plugins
app.register(authPlugin);
app.register(authorizePlugin);
app.register(metrics);

const routes = [
  { plugin: profileRoutes, prefix: "api/profiles" },
  { plugin: friendshipRoutes, prefix: "api/friendships" },
  { plugin: authRoutes, prefix: "api/auth" },
  { plugin: userRoutes, prefix: "api/users" },
];

routes.forEach((route) => {
  app.register(route.plugin, { prefix: route.prefix });
});
// app.register(chatRoutes, { prefix: 'api/chat' });
// app.register(gameRoutes, { prefix: '/game' });

export default app;
