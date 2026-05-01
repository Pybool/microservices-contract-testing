import { v4 as uuid } from "uuid";
import { Order, CreateOrderDTO, OrderStatus } from "../types";
import { OrderRepository } from "../repositories/orderRepository";
import { UsersClient } from "./usersClient";
import { logger } from "../logger";

export class OrderService {
  constructor(private usersClient: UsersClient) {}

  async createOrder(dto: CreateOrderDTO): Promise<Order> {
    const user = await this.usersClient.getUser(dto.userId);
    if (!user) {
      throw Object.assign(new Error(`User ${dto.userId} not found`), {
        statusCode: 404,
      });
    }

    if (dto.items.length === 0) {
      throw Object.assign(new Error("Order must contain at least one item"), {
        statusCode: 400,
      });
    }

    const totalCents = dto.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    const now = new Date().toISOString();
    const order: Order = {
      id: uuid(),
      userId: dto.userId,
      items: dto.items,
      status: "pending",
      totalCents,
      createdAt: now,
      updatedAt: now,
    };

    OrderRepository.save(order);
    logger.info("Order created", { orderId: order.id, userId: user.id, totalCents });
    return order;
  }

  getOrder(id: string): Order | undefined {
    return OrderRepository.findById(id);
  }

  getOrdersByUser(userId: number): Order[] {
    return OrderRepository.findByUserId(userId);
  }

  getAllOrders(): Order[] {
    return OrderRepository.findAll();
  }

  updateStatus(id: string, status: OrderStatus): Order | undefined {
    const order = OrderRepository.findById(id);
    if (!order) return undefined;

    if (order.status === "cancelled") {
      throw Object.assign(new Error("Cannot update a cancelled order"), {
        statusCode: 409,
      });
    }

    const updated = OrderRepository.update(id, { status });
    logger.info("Order status updated", { orderId: id, status });
    return updated;
  }
}
