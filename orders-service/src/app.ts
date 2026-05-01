import express from "express";
import morgan from "morgan";
import { createOrdersRouter } from "./controllers/ordersController";
import { OrderService } from "./services/orderService";
import { UsersClient } from "./services/usersClient";
import { errorHandler } from "./middleware/errorHandler";

export const createApp = (usersServiceUrl: string) => {
  const app = express();

  app.use(express.json());
  app.use(morgan("dev"));

  const usersClient = new UsersClient(usersServiceUrl);
  const orderService = new OrderService(usersClient);

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "orders" }));
  app.use("/", createOrdersRouter(orderService));
  app.use(errorHandler);

  return app;
};
