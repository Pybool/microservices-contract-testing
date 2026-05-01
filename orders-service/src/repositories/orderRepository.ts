import { Order } from "../types";

const store = new Map<string, Order>();

export const OrderRepository = {
  save(order: Order): Order {
    store.set(order.id, order);
    return order;
  },

  findById(id: string): Order | undefined {
    return store.get(id);
  },

  findByUserId(userId: number): Order[] {
    return [...store.values()].filter((o) => o.userId === userId);
  },

  findAll(): Order[] {
    return [...store.values()];
  },

  update(id: string, patch: Partial<Order>): Order | undefined {
    const existing = store.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    store.set(id, updated);
    return updated;
  },

  clear(): void {
    store.clear();
  },
};
