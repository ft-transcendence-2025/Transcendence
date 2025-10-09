//0
import { FastifyPluginAsync, FastifyInstance } from "fastify";
import proxy from "@fastify/http-proxy";
import { blockchainPreHandler } from "../middlewares/blockchain-prehandler";

const blockchainProxy: FastifyPluginAsync = async (app: any) => {
   
  //Catch all proxy
  app.register(proxy, {
    upstream: "http://blockchain:3000",
    prefix: "/api/blockchain",
    rewritePrefix: "/",
    preHandler: [app.authenticate],
    // preHandler: blockchainPreHandler(app),
  });

};

export default blockchainProxy;
