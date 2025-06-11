// src/plugins/authorize.ts
import { FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

export default fp(async (app) => {
	app.decorate('authorize', (validate: (user: any, req: any) => boolean) => {
		return async (req: FastifyRequest, reply: FastifyReply) => {
			const user = req.user;
			if (!validate(user, req)) {
				return reply.status(403).send({ message: 'Access denied.' });
			}
		};
	});
});
