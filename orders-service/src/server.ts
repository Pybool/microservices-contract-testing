import { createApp } from "./app";
import { logger } from "./logger";

const PORT = process.env.PORT || 3000;
const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || "http://localhost:5000";

const app = createApp(USERS_SERVICE_URL);

app.listen(PORT, () => {
  logger.info(`Orders service running on port ${PORT}`);
  logger.info(`Talking to Users service at ${USERS_SERVICE_URL}`);
});
