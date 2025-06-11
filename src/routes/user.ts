// src/routes/user.ts
import { FastifyPluginAsync, FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as policy from '../policies/user-policy';
import axios from 'axios';

const userRoutes: FastifyPluginAsync = async (app: any) => {
	app.get('/', {
		preHandler: [app.authenticate, app.authorize(policy.canListUsers)],
	}, async (req: FastifyRequest, reply: FastifyReply) => {
		const response = await axios.get('http://user-management:3001/users');
		reply.send(response.data);
	});

	app.get('/:id', {
		preHandler: [app.authenticate, app.authorize(policy.canViewUser)],
	}, async (req: FastifyRequest, reply: FastifyReply) => {
		const { id } = req.params as { id: string };
		const response = await axios.get(`http://user-management:3001/users/${id}`);
		reply.send(response.data);
	});
};

export default userRoutes;
