import Fastify from "fastify";
import { routes } from "./routes.js";
const fastify = Fastify({ logger: true });
fastify.register(routes, { prefix: '/api/game' });
fastify.listen({ port: 6969, host: "0.0.0.0" }, (err, address) => {
    if (err) {
        console.log(err);
        process.exit(1);
    }
    console.log("Listening on:", address);
});
