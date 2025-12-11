import { createEnv } from "@t3-oss/env-core";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: "../../.env" });

export const env = createEnv({
  server: {
    SERVER_PORT: z.coerce.number(),
    SERVER_URL: z.url(),
    CORS_ORIGINS: z
      .string()
      .transform((val) => val.split(",").map((s) => s.trim())),
    DATABASE_URL: z.url(),
  },
  runtimeEnv: process.env,
});
