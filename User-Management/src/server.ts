import "dotenv/config";
import app from "./app";
import prisma from "./lib/prisma";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const HOST = process.env.HOST || "0.0.0.0";

async function main() {
  try {
    await app.listen({ port: PORT, host: HOST });
  } catch (err : any) {
    app.log.error("Could not initiate server...", err);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  app.log.info("Received SIGINT. Initiating graceful shutdown...");
  app.log.info("Server closed. Disconnecting from database...");
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
});

main();
