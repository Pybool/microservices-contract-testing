import { Request, Response, NextFunction } from "express";
import { logger } from "../logger";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const status = err.statusCode || 500;
  logger.error("Unhandled error", { message: err.message, stack: err.stack });
  res.status(status).json({ error: err.message || "Internal server error" });
};
