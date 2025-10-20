import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import fastifyMultipart from "@fastify/multipart";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import friendshipRoutes from "./routes/friendship.route";
import profileRoutes from "./routes/profile.route";
import {
  performHealthCheck,
  checkReadiness,
  checkLiveness,
} from "./lib/health";
import prometheus from "fastify-metrics";

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

// Enhanced health check endpoint
app.get("/health", async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const healthCheck = await performHealthCheck();
    const statusCode = healthCheck.status === "ok" ? 200 : 503;
    return res.code(statusCode).send(healthCheck);
  } catch (error) {
    return res.code(503).send({
      status: "error",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Health check failed",
      uptime: `${Math.floor(process.uptime())}s`,
    });
  }
});

// Lightweight readiness probe (for Kubernetes)
app.get("/ready", async (req: FastifyRequest, res: FastifyReply) => {
  try {
    const readiness = await checkReadiness();
    const statusCode = readiness.ready ? 200 : 503;
    return res.code(statusCode).send(readiness);
  } catch {
    return res.code(503).send({ status: "not ready", ready: false });
  }
});

// Liveness probe (for Kubernetes)
app.get("/live", async (req: FastifyRequest, res: FastifyReply) => {
  const liveness = checkLiveness();
  return res.code(200).send(liveness);
});

app.register(fastifyMultipart);
app.register(prometheus);

[
  { route: authRoutes, prefix: "/auth" },
  { route: userRoutes, prefix: "/users" },
  { route: profileRoutes, prefix: "/profiles" },
  { route: friendshipRoutes, prefix: "/friendships" },
].forEach(({ route, prefix }) => app.register(route, { prefix }));

export default app;
