import Fastify, { fastify, FastifyRegister, FastifyRequest } from 'fastify';
import websocket from '@fastify/websocket';
import conversationRoutes from './routes/conversation.route';
import { chatHandler } from './controllers/chat.controller';

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

app.register(websocket);


app.register(async function (app) {
    app.get('/ws', { websocket: true }, chatHandler);
});


app.register(conversationRoutes, { prefix: "/conversations" });

export default app;