import dotenv from "dotenv";

dotenv.config();

export const config = {
  BROKER_URL: process.env.PACT_BROKER_URL || "http://localhost:9292",
};