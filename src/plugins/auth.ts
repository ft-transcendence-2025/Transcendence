// src/plugins/auth.ts
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { FastifyReply, FastifyRequest } from 'fastify';

export default fp(async (app) => {
	app.register(fastifyJwt, {
		secret: process.env.JWT_SECRET!,
	});

	app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
		try {
			await req.jwtVerify();
		} catch (err) {
			reply.status(401).send({ message: 'Invalid Token.' });
		}
	});
});
