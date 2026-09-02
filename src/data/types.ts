export type OrderStatus =
  | "recibido"
  | "preparacion"
  | "listo"
  | "en_camino"
  | "entregado";

export const ORDER_FLOW: OrderStatus[] = [
  "recibido",
  "preparacion",
  "listo",
  "en_camino",
  "entregado",
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  recibido: "Recibido",
  preparacion: "En preparación",
  listo: "Listo",
  en_camino: "En camino",
  entregado: "Entregado",
};

export const NEXT_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  recibido: "Marcar en preparación",
  preparacion: "Marcar como listo",
  listo: "Marcar en camino",
  en_camino: "Marcar como entregado",
};

export type CourierStatus = "disponible" | "en_entrega" | "fuera_servicio";

export const COURIER_STATUS_LABEL: Record<CourierStatus, string> = {
  disponible: "Disponible",
  en_entrega: "En entrega",
  fuera_servicio: "Fuera de servicio",
};

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  /** Código corto legible del pedido (persistido en la base de datos). */
  code?: string;
  restaurantId?: string;
  customerId?: string;
  customer: string;
  phone: string;
  address: string;
  time: string;
  date: string;
  items: OrderItem[];
  delivery: number;
  status: OrderStatus;
  courierId: string | null;
  assignedAt: string | null;
  note?: string;
  /** Coordenadas simuladas (0-100) para la representación de ruta del MVP */
  route: { from: { x: number; y: number }; to: { x: number; y: number } };
}

export interface Courier {
  id: string;
  name: string;
  status: CourierStatus;
  vehicle: string;
  distanceKm: number;
  activeOrders: number;
  lastActivity: string;
  rating: number;
  phone: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  emoji: string;
  categoryId?: string | null;
}

export interface ActivityEvent {
  id: string;
  message: string;
  time: string;
  kind: "nuevo" | "estado" | "repartidor" | "entrega";
}

export const subtotalOf = (order: Order) =>
  order.items.reduce((acc, i) => acc + i.price * i.qty, 0);

export const totalOf = (order: Order) => subtotalOf(order) + order.delivery;

export const formatCLP = (value: number) =>
  "$" + value.toLocaleString("es-CL", { maximumFractionDigits: 0 });
