import { Router, Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import { OrderService } from "../services/orderService";
import { OrderStatus } from "../types";

export const createOrdersRouter = (orderService: OrderService): Router => {
  const router = Router();

  router.post(
    "/orders",
    body("userId").isInt({ min: 1 }),
    body("items").isArray({ min: 1 }),
    body("items.*.productId").isString().notEmpty(),
    body("items.*.name").isString().notEmpty(),
    body("items.*.quantity").isInt({ min: 1 }),
    body("items.*.unitPrice").isInt({ min: 0 }),
    async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Validation failed", details: errors.array() });
        return;
      }

      try {
        const order = await orderService.createOrder(req.body);
        res.status(201).json({ data: order });
      } catch (err: any) {
        res.status(err.statusCode || 500).json({ error: err.message });
      }
    }
  );

  router.get("/orders", (_req: Request, res: Response) => {
    res.json({ data: orderService.getAllOrders() });
  });

  router.get(
    "/orders/:id",
    param("id").isUUID(),
    (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Invalid order id" });
        return;
      }
      const order = orderService.getOrder(req.params.id);
      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }
      res.json({ data: order });
    }
  );

  router.get(
    "/orders/user/:userId",
    param("userId").isInt({ min: 1 }),
    (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Invalid userId" });
        return;
      }
      const orders = orderService.getOrdersByUser(Number(req.params.userId));
      res.json({ data: orders });
    }
  );

  router.patch(
    "/orders/:id/status",
    param("id").isUUID(),
    body("status").isIn(["pending", "confirmed", "shipped", "cancelled"]),
    (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Validation failed", details: errors.array() });
        return;
      }
      try {
        const order = orderService.updateStatus(
          req.params.id,
          req.body.status as OrderStatus
        );
        if (!order) {
          res.status(404).json({ error: "Order not found" });
          return;
        }
        res.json({ data: order });
      } catch (err: any) {
        res.status(err.statusCode || 500).json({ error: err.message });
      }
    }
  );

  return router;
};
