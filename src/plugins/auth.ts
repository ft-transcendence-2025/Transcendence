// src/plugins/auth.ts
import fp from "fastify-plugin";
import fastifyJwt, { FastifyJwtNamespace } from "@fastify/jwt";

// Extend FastifyRequest to include accessJwt and refreshJwt
declare module "fastify" {
  interface FastifyRequest {
    accessToken: FastifyJwtNamespace<any>;
    refreshToken: FastifyJwtNamespace<any>;
  }
}

// You can't directly register multiple secrets with a single fastify-jwt instance.
// To use different secrets for access and refresh tokens, you can register fastify-jwt twice with different prefixes.

export default fp(async (app) => {
  app.register(fastifyJwt, {
    secret: process.env.JWT_ACCESS_SECRET!,
    namespace: "accessToken",
  });

  app.register(fastifyJwt, {
    secret: process.env.JWT_REFRESH_SECRET!,
    cookie: {
      cookieName: "refreshToken",
      signed: false, // EXTREMELY IMPORTANT!!!! DO NOT DELETE BY ANY MEANS!!!! NOR CHANGE IT TO TRUE !!!!
    },
    sign: {
      expiresIn: "30d",
    },
    namespace: "refreshToken",
  });

  app.decorate("authenticate", async (req: any, reply: any) => {
    try {
      await req.accessTokenJwtVerify();
    } catch (err) {
      reply.status(401).send({ message: "Invalid Token." });
    }
  });

  app.decorate("authenticateRefresh", async (req: any, reply: any) => {
    try {
      await req.refreshTokenJwtVerify({ onlyCookie: true });
    } catch (err) {
      reply.status(401).send({ message: "Invalid Refresh Token." });
    }
  });
});
