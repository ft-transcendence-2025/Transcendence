import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import * as policy from '../policies/user-policy';
import * as userService from '../services/userManagement-service';
import dotenv from 'dotenv';

dotenv.config({
  path : './.env'
});

const userRoutes: FastifyPluginAsync = async (app: any) => {
	app.get('/', {
		preHandler: [app.authenticate, app.authorize(policy.canListUsers)],
	}, async (req: FastifyRequest, reply: FastifyReply) => {
		const response = await userService.getUsers();
		reply.send(response.data);
	});

	app.get('/:username', {
		preHandler: [app.authenticate, app.authorize(policy.canViewUser)],
	}, async (req: FastifyRequest, reply: FastifyReply) => {
		const { usernmae } = req.params as { usernmae: string };
		const response = await userService.getUserByUsername(usernmae);
		reply.send(response.data);
	});

	app.post('/login', {}, async (req: FastifyRequest, reply: FastifyReply) => {
		try {
			const response = await userService.loginUser(req.body);
			const user = response.data?.user;
			const token = await reply.jwtSign(
				{ id: user.id, email: user?.email, username: user.username },
				{ expiresIn: '10m' }
			);
			reply.send({ token });
		} catch (error: any) {
			reply.status(error.response?.status || 500).send(error.response?.data || { message: 'Internal server error' });
		}
	});
};

export default userRoutes;