import { FastifyInstance } from "fastify";

export const WebsocketHandler = (connection: any, request: any) => {
    console.log('Client connected');

    connection.send('Connected to Fastify WebSocket server!');

    connection.on('message', (message: any) => {
      const text = message.toString();
      console.log('Received:', text);
      connection.send(`Echo: ${text}`);
    });

      connection.on('close', () => {
        console.log('Client disconnected');
      });
  }