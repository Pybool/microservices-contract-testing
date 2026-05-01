import { config } from "./config";

const BROKER_URL = config?.PACT_BROKER_URL || "http://16.171.160.56:9292";

export async function checkBroker() {
  try {
    const res = await fetch(BROKER_URL);
    if (!res.ok) {
      throw new Error(`Broker responded with status ${res.status}`);
    }
    console.log(" Pact Broker is up");
  } catch (err: any) {
    console.error("Pact Broker is NOT reachable:", err.message);
    process.exit(1);
  }
}
