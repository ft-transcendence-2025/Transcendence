import Fastify from 'fastify';
import conversationRoutes from './routes/conversation.route';

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

const app = Fastify({
  logger: envToLogger[environment] ?? true,
});

app.register(conversationRoutes, { prefix: "/conversations" });

export default app;