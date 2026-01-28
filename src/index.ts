import mongoose from "mongoose";
import http from "http";
import { promisify } from "util";
import { env } from "./env";
import { logger } from "./logger";
import { app } from "./app";
import { createFirstUser } from "./services/user-services/user.services";
import { prefillDB } from "./prefill";

async function shutdown(server: http.Server, signal: string) {
  logger.info(
    `Received shutdown signal: ${signal}. Starting shutdown process...`,
  );

  try {
    await mongoose.disconnect();
    logger.info("Successfully disconnected from MongoDB.");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error(`Failed to disconnect from MongoDB: ${message}`);
  }

  const closeServer = promisify(server.close).bind(server);

  try {
    await closeServer();
    logger.info("Server shut down gracefully.");
    process.exit(0);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error(`Error while shutting down the server: ${message}`);
    process.exit(1);
  }
}

async function main() {
  try {
    logger.debug("Environment variables loaded successfully");

    await mongoose.connect(env.MONGODB_URI);
    logger.info(`Connected to MongoDB at URI: ${env.MONGODB_URI}.`);
    
    await createFirstUser({
      userName: env.ADMIN_USER_NAME,
      email: env.ADMIN_USER_EMAIL,
      password: env.ADMIN_USER_PASSWORD,
    })
    
    if (process.env.DB_PREFILL === "true") {
      await prefillDB();
    }
    const server = http.createServer(app);
    server.listen(env.PORT, () => {
      logger.info(
        `Server is running and listening at http://localhost:${env.PORT}.`,
      );
    });

    for (const signal of ["SIGINT", "SIGTERM"]) {
      process.on(signal, () => shutdown(server, signal));
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error(`Application startup failed: ${message}`);
    process.exit(1);
  }
}

main();
