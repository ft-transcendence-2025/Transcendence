// src/server.ts
import app from './app';
import cors from '@fastify/cors';
import dotenv from 'dotenv';

dotenv.config({
  path : './.env'
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

app.register(cors, {
  origin: '*', // Adjust as needed for your use case
});



start();