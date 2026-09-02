import { supabase } from "@/integrations/supabase/client";
import type {
  Courier,
  CourierStatus,
  Order,
  OrderStatus,
  Product,
} from "@/data/types";

/** Coordenadas simuladas y deterministas (0-100) para la ruta A → B del MVP. */
function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 100000;
  return h;
}

export function routeFor(id: string) {
  const h = hash(id);
  return {
    from: { x: 20, y: 70 },
    to: { x: 30 + (h % 55), y: 16 + ((h >> 3) % 60) },
  };
}

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
const dateOf = (iso: string) => new Date(iso).toISOString().slice(0, 10);

export interface DbOrderRow {
  id: string;
  code: string;
  customer_id: string;
  restaurant_id: string;
  courier_id: string | null;
  customer_name: string;
  customer_phone: string;
  address: string;
  note: string | null;
  status: OrderStatus;
  delivery_fee: number;
  assigned_at: string | null;
  created_at: string;
  order_items?: { name: string; qty: number; unit_price: number }[];
}

export function mapOrder(row: DbOrderRow): Order {
  return {
    id: row.id,
    code: row.code,
    customer: row.customer_name || "Cliente",
    phone: row.customer_phone,
    address: row.address,
    time: timeOf(row.created_at),
    date: dateOf(row.created_at),
    items: (row.order_items ?? []).map((i) => ({
      name: i.name,
      qty: i.qty,
      price: i.unit_price,
    })),
    delivery: row.delivery_fee,
    status: row.status,
    courierId: row.courier_id,
    assignedAt: row.assigned_at ? timeOf(row.assigned_at) : null,
    note: row.note ?? undefined,
    route: routeFor(row.id),
    restaurantId: row.restaurant_id,
    customerId: row.customer_id,
  };
}

export const ORDERS_SELECT =
  "id, code, customer_id, restaurant_id, courier_id, customer_name, customer_phone, address, note, status, delivery_fee, assigned_at, created_at, order_items(name, qty, unit_price)";

export async function fetchOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDERS_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as DbOrderRow[]).map(mapOrder);
}

export async function fetchCouriers(): Promise<Courier[]> {
  const { data, error } = await supabase
    .from("couriers")
    .select("id, name, status, vehicle, phone, updated_at")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status as CourierStatus,
    vehicle: c.vehicle,
    distanceKm: Number(((hash(c.id) % 60) / 10 + 0.4).toFixed(1)),
    activeOrders: 0,
    lastActivity: c.updated_at ? timeOf(c.updated_at) : "—",
    rating: Number((4.4 + (hash(c.name) % 6) / 10).toFixed(1)),
    phone: c.phone,
  }));
}

export async function fetchRestaurant() {
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, address, phone, schedule, is_open")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, sort_order, restaurant_id")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function fetchProducts(): Promise<Product[]> {
  const [{ data, error }, categories] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, description, price, available, emoji, category_id, restaurant_id")
      .order("name"),
    fetchCategories(),
  ]);
  if (error) throw error;
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    category: (p.category_id && catName.get(p.category_id)) || "General",
    available: p.available,
    emoji: p.emoji,
    categoryId: p.category_id,
  }));
}

export async function fetchOrderHistory(orderId: string) {
  const { data, error } = await supabase
    .from("order_status_history")
    .select("id, status, created_at")
    .eq("order_id", orderId)
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}

/** Cambia el estado de un pedido y registra el histórico en la base de datos. */
export async function setOrderStatus(orderId: string, status: OrderStatus) {
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) throw error;
  const { data: userData } = await supabase.auth.getUser();
  await supabase.from("order_status_history").insert({
    order_id: orderId,
    status,
    changed_by: userData.user?.id ?? null,
  });
}
