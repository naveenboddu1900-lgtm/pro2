import { createApp } from "./app.js";
import { config } from "./config.js";
import { connectDatabase } from "./db.js";
import "./models/index.js";

async function startServer() {
  await connectDatabase(config.mongoUri);

  const app = createApp();

  app.listen(config.port, () => {
    console.log(`Pro2 foundation server listening on port ${config.port}`);
  });
}

startServer().catch((error) => {
  console.error("Unable to start Pro2 foundation server");
  console.error(error);
  process.exit(1);
});
