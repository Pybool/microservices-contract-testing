import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { OrderService } from "../services/orderService";
import { UsersClient } from "../services/usersClient";
import { OrderRepository } from "../repositories/orderRepository";
import { User } from "../types";

const makeStubClient = (user: User | null): UsersClient => {
  return {
    getUser: jest.fn<() => Promise<User | null>>().mockResolvedValue(user),
    userExists: jest.fn<() => Promise<boolean>>().mockResolvedValue(user !== null),
  } as unknown as UsersClient;
};

beforeEach(() => {
  OrderRepository.clear();
});

const validItem = {
  productId: "prod-1",
  name: "Widget",
  quantity: 2,
  unitPrice: 500,
};

const aliceUser: User = { id: 1, name: "Alice", email: "a@b.com" };

describe("OrderService.createOrder", () => {
  test("creates order when user exists", async () => {
    const svc = new OrderService(makeStubClient(aliceUser));
    const order = await svc.createOrder({ userId: 1, items: [validItem] });

    expect(order.id).toBeDefined();
    expect(order.status).toBe("pending");
    expect(order.totalCents).toBe(1000);
    expect(order.userId).toBe(1);
  });

  test("throws 404 when user does not exist", async () => {
    const svc = new OrderService(makeStubClient(null));

    await expect(
      svc.createOrder({ userId: 99, items: [validItem] })
    ).rejects.toMatchObject({
      message: "User 99 not found",
      statusCode: 404,
    });
  });

  test("throws 400 when items list is empty", async () => {
    const svc = new OrderService(makeStubClient(aliceUser));

    await expect(
      svc.createOrder({ userId: 1, items: [] })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});


describe("OrderService.updateStatus", () => {
  test("updates status from pending → confirmed", async () => {
    const svc = new OrderService(makeStubClient(aliceUser));
    const order = await svc.createOrder({ userId: 1, items: [validItem] });

    const updated = svc.updateStatus(order.id, "confirmed");
    expect(updated?.status).toBe("confirmed");
  });

  test("throws 409 when trying to update a cancelled order", async () => {
    const svc = new OrderService(makeStubClient(aliceUser));
    const order = await svc.createOrder({ userId: 1, items: [validItem] });

    svc.updateStatus(order.id, "cancelled");

    expect(() => svc.updateStatus(order.id, "confirmed")).toThrow();
  });
});