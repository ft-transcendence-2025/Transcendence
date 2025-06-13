// src/app.ts
import Fastify from 'fastify';
import dotenv from 'dotenv';
import authPlugin from './plugins/auth';
import authorizePlugin from './plugins/authorize';
import userRoutes from './routes/user';
// import chatRoutes from './routes/chat';
// import gameRoutes from './routes/game';

dotenv.config();

const app = Fastify({ logger: true });

app.addHook('onRequest', async (request, reply) => {
	app.log.info({
		method: request.method,
		url: request.url,
		headers: request.headers,
		body: request.body
	}, 'Incoming request');
});

// 📌 Registro dos plugins
app.register(authPlugin);
app.register(authorizePlugin);

// 📌 Registro das rotas
app.register(userRoutes, { prefix: 'api/users' });
// app.register(chatRoutes, { prefix: '/chat' });
// app.register(gameRoutes, { prefix: '/game' });

export default app;
