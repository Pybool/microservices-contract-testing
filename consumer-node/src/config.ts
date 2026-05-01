import dotenv from "dotenv";

dotenv.config();

export const config = {
  PACT_BROKER_URL: process.env.PACT_BROKER_URL || "http://16.171.160.56:9292",
};