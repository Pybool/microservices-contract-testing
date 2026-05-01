

import { PactV3, MatchersV3 } from "@pact-foundation/pact";
import path from "path";
import { UsersClient } from "../services/usersClient";
import { describe, test, expect, beforeAll } from '@jest/globals';
import { checkBroker } from "../pactbrokerChecker";

const { like } = MatchersV3;

const provider = new PactV3({
  consumer: "orders-service",
  provider: "users-service",
  dir: path.resolve(process.cwd(), "pacts"),
  logLevel: "warn",
});

beforeAll(async () => {
  await checkBroker();
});

describe("Orders → Users Service Contract", () => {

  // ── Interaction 1: fetch existing user ──────────────────────────────────────
  test("GET /users/:id — returns a user when the user exists", async () => {
    await provider
      .addInteraction({
        states: [{ description: "user 1 exists" }],
        uponReceiving: "a request for user with id 1",
        withRequest: { method: "GET", path: "/users/1" },
        willRespondWith: {
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: {
            id: like(1),
            name: like("Alice Nguyen"),
            email: like("alice@example.com"),
          },
        },
      })
      .executeTest(async (mockServer) => {
        const client = new UsersClient(mockServer.url);
        const user = await client.getUser(1);

        expect(user).not.toBeNull();
        expect(user!.id).toBe(1);
        expect(typeof user!.name).toBe("string");
        expect(typeof user!.email).toBe("string");
      });
  });

  // ── Interaction 2: user not found ────────────────────────────────────────────
  test("GET /users/:id — returns null when user does not exist", async () => {
    await provider
      .addInteraction({
        states: [{ description: "user 999 does not exist" }],
        uponReceiving: "a request for a non-existent user (id 999)",
        withRequest: { method: "GET", path: "/users/999" },
        willRespondWith: {
          status: 404,
          headers: { "Content-Type": "application/json" },
          body: { detail: like("User not found") },
        },
      })
      .executeTest(async (mockServer) => {
        const client = new UsersClient(mockServer.url);
        const user = await client.getUser(999);
        expect(user).toBeNull();
      });
  });

  // ── Interaction 3: userExists convenience method ──────────────────────────────
  test("userExists() — returns true when user is found", async () => {
    await provider
      .addInteraction({
        states: [{ description: "user 2 exists" }],
        uponReceiving: "a request to check if user 2 exists",
        withRequest: { method: "GET", path: "/users/2" },
        willRespondWith: {
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: {
            id: like(2),
            name: like("Bob Smith"),
            email: like("bob@example.com"),
          },
        },
      })
      .executeTest(async (mockServer) => {
        const client = new UsersClient(mockServer.url);
        const exists = await client.userExists(2);
        expect(exists).toBe(true);
      });
  });

  // ── Interaction 4: userExists returns false ───────────────────────────────────
  test("userExists() — returns false when user is not found", async () => {
    await provider
      .addInteraction({
        states: [{ description: "user 42 does not exist" }],
        uponReceiving: "a request to check if user 42 exists",
        withRequest: { method: "GET", path: "/users/42" },
        willRespondWith: {
          status: 404,
          headers: { "Content-Type": "application/json" },
          body: { detail: like("User not found") },
        },
      })
      .executeTest(async (mockServer) => {
        const client = new UsersClient(mockServer.url);
        const exists = await client.userExists(42);
        expect(exists).toBe(false);
      });
  });
});
