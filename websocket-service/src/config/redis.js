const { createClient } =
  require("redis");

const logger =
  require("../utils/logger");

const pubClient =
  createClient({

    url: "redis://localhost:6379"

  });

const subClient =
  pubClient.duplicate();

pubClient.on(
  "error",
  err => {

    logger.error(
      `Redis Error:
       ${err.message}`
    );

  }
);

const connectRedis =
  async () => {

    await pubClient.connect();

    await subClient.connect();

    logger.info(
      "Redis Connected"
    );

};

module.exports = {

  pubClient,
  subClient,
  connectRedis

};