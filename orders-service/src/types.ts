export type OrderStatus = "pending" | "confirmed" | "shipped" | "cancelled";

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number; 
}

export interface Order {
  id: string;
  userId: number;
  items: OrderItem[];
  status: OrderStatus;
  totalCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderDTO {
  userId: number;
  items: Omit<OrderItem, never>[];
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: string;
  details?: unknown;
}
