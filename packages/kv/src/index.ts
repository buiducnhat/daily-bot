import { env } from "@daily-bot/env/server";
import { createKeyv as createKeyvRedis } from "@keyv/redis";
import { createCache } from "cache-manager";

export const redisStore = createKeyvRedis(env.REDIS_URL, {
  namespace: env.REDIS_PREFIX,
});

export const cache = createCache({
  stores: [redisStore],
});
