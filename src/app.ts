// src/app.ts
import Fastify from 'fastify';
import dotenv from 'dotenv';
import authPlugin from './plugins/auth';
import authorizePlugin from './plugins/authorize';
import userRoutes from './routes/userRoutes';
import profileRoutes from './routes/profileRoutes';
import friendshipRoutes from './routes/friendshipRoutes';
import prometheus from "fastify-metrics"

// import chatRoutes from './routes/chat';
// import gameRoutes from './routes/game';

dotenv.config({
	path: './.env'
});

const envToLogger = {
	development: {
		transport: {
			target: 'pino-pretty',
			options: {
				translateTime: 'HH:MM:ss Z',
				ignore: 'pid,hostname',
			},
		},
	},
	production: true,
	test: false,
};

type Environment = 'development' | 'production' | 'test';
const environment = (process.env.NODE_ENV as Environment) || 'development';

const app = Fastify({ logger: envToLogger[environment] ?? true });


// 📌 Registro dos plugins
app.register(authPlugin);
app.register(authorizePlugin);
app.register(prometheus);

app.register(userRoutes, { prefix: 'api/users' });
app.register(profileRoutes, { prefix: 'api/profiles' });
app.register(friendshipRoutes, { prefix: 'api/friendships' });
// app.register(chatRoutes, { prefix: 'api/chat' });
// app.register(gameRoutes, { prefix: '/game' });

export default app;
