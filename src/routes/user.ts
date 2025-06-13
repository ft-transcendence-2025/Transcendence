// src/routes/user.ts
import { FastifyPluginAsync, FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as policy from '../policies/user-policy';
import axios from 'axios';

const userRoutes: FastifyPluginAsync = async (app: any) => {
	app.get('/', {
		// preHandler: [app.authenticate, app.authorize(policy.canListUsers)],
	}, async (req: FastifyRequest, reply: FastifyReply) => {
		console.log('Received GET / request', { url: req.url, method: req.method, query: req.query });
		const response = await axios.get('http://user-management:3000/api/users');
		reply.send(response.data);
	});

	app.get('/:id', {
		// preHandler: [app.authenticate, app.authorize(policy.canViewUser)],
	}, async (req: FastifyRequest, reply: FastifyReply) => {
		console.log('Received GET / request', { url: req.url, method: req.method, query: req.query });
		const { id } = req.params as { id: string };
		const response = await axios.get(`http://user-management:3000/api/users/${id}`);
		reply.send(response.data);
	});
};

export default userRoutes;
