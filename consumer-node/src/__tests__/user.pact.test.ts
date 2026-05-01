import { PactV3, MatchersV3 } from "@pact-foundation/pact";
import path from "path";
import { createUserClient } from "../userClient";
import { describe, test, expect, beforeAll } from '@jest/globals';
import { checkBroker } from "../pactbrokerChecker";

const { like, eachLike } = MatchersV3;

const provider = new PactV3({
  consumer: "consumer-node",
  provider: "provider-python",
  dir: path.resolve(process.cwd(), "pacts"),
  logLevel: "warn",
});

beforeAll(async () => {
  await checkBroker();
});

describe("User API Contract", () => {
  test("GET /users returns a list of users", async () => {
    await provider
      .addInteraction({
        states: [{ description: "users exist" }],
        uponReceiving: "a request for all users",
        withRequest: {
          method: "GET",
          path: "/users",
        },
        willRespondWith: {
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: eachLike({
            id: like(1),
            name: like("Alice"),
            email: like("alice@example.com"),
          }),
        },
      })
      .executeTest(async (mockServer) => {
        const client = createUserClient(mockServer.url);
        const users = await client.getUsers();
        expect(users).toHaveLength(1);
        expect(users[0]).toHaveProperty("id");
        expect(users[0]).toHaveProperty("name");
        expect(users[0]).toHaveProperty("email");
      });
  });

  test("GET /users/:id returns a single user", async () => {
    await provider
      .addInteraction({
        states: [{ description: "user with id 1 exists" }],
        uponReceiving: "a request for user with id 1",
        withRequest: {
          method: "GET",
          path: "/users/1",
        },
        willRespondWith: {
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: {
            id: like(1),
            name: like("Alice"),
            email: like("alice@example.com"),
          },
        },
      })
      .executeTest(async (mockServer) => {
        const client = createUserClient(mockServer.url);
        const user = await client.getUserById(1);
        expect(user.id).toBe(1);
        expect(user.name).toBeDefined();
        expect(user.email).toBeDefined();
      });
  });

  test("GET /users/:id returns 404 for missing user", async () => {
    await provider
      .addInteraction({
        states: [{ description: "user with id 999 does not exist" }],
        uponReceiving: "a request for a non-existent user",
        withRequest: {
          method: "GET",
          path: "/users/999",
        },
        willRespondWith: {
          status: 404,
          headers: { "Content-Type": "application/json" },
          body: { detail: like("User not found") },
        },
      })
      .executeTest(async (mockServer) => {
        const client = createUserClient(mockServer.url);
        await expect(client.getUserById(999)).rejects.toThrow();
      });
  });
});
