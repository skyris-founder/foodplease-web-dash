import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { PRODUCTS } from "@/data/mock";
import {
  ORDER_FLOW,
  STATUS_LABEL,
  type ActivityEvent,
  type Courier,
  type Order,
  type OrderStatus,
  type Product,
} from "@/data/types";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/store/auth";

/**
 * Estado del panel de restaurante. `orders`, `couriers` y `activity` se leen
 * y escriben en Supabase (recibido -> preparación -> listo, asignación de
 * repartidor). `products` sigue siendo local por ahora — se conecta a
 * `products`/`categories` en el siguiente paso, sin tocar esta interfaz.
 */
interface Settings {
  name: string;
  address: string;
  phone: string;
  schedule: string;
  isOpen: boolean;
  notifyNewOrders: boolean;
  notifyStatusChanges: boolean;
}

interface Store {
  orders: Order[];
  couriers: Courier[];
  products: Product[];
  activity: ActivityEvent[];
  settings: Settings;
  loading: boolean;
  restaurantId: string | null;
  advanceStatus: (orderId: string) => void;
  assignCourier: (orderId: string, courierId: string) => void;
  toggleProduct: (productId: string) => void;
  addProduct: (p: Omit<Product, "id" | "emoji">) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  getCourier: (id: string | null) => Courier | undefined;
}

const FoodPleaseContext = createContext<Store | null>(null);

const DEFAULT_SETTINGS: Settings = {
  name: "",
  address: "",
  phone: "",
  schedule: "",
  isOpen: true,
  notifyNewOrders: true,
  notifyStatusChanges: true,
};

type RestaurantRow = Tables<"restaurants">;
type OrderRow = Tables<"orders">;
type CourierRow = Tables<"couriers">;

const pad2 = (n: number) => String(n).padStart(2, "0");

function toLocalDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toLocalTime(iso: string) {
  const d = new Date(iso);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function relativeTime(iso: string | null | undefined) {
  if (!iso) return "Sin actividad reciente";
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "Hace instantes";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} h`;
  return `Hace ${Math.round(diffH / 24)} d`;
}

interface DashboardData {
  orders: Order[];
  couriers: Courier[];
  activity: ActivityEvent[];
}

async function loadDashboardData(restaurant: RestaurantRow): Promise<DashboardData> {
  const { data: orderRows, error: ordersError } = await supabase
    .from("orders")
    .select("*")
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: false });
  if (ordersError) throw ordersError;
  const orders = (orderRows ?? []) as OrderRow[];
  const orderIds = orders.map((o) => o.id);

  const [itemsRes, couriersRes, historyRes] = await Promise.all([
    orderIds.length
      ? supabase.from("order_items").select("*").in("order_id", orderIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("couriers").select("*").order("created_at"),
    orderIds.length
      ? supabase
          .from("order_status_history")
          .select("*")
          .in("order_id", orderIds)
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (itemsRes.error) throw itemsRes.error;
  if (couriersRes.error) throw couriersRes.error;
  if (historyRes.error) throw historyRes.error;

  const items = itemsRes.data ?? [];
  const courierRows = (couriersRes.data ?? []) as CourierRow[];
  const history = historyRes.data ?? [];

  const customerIds = [...new Set(orders.map((o) => o.customer_id))];
  const productIds = [...new Set(items.map((i) => i.product_id))];
  const courierProfileIds = [...new Set(courierRows.map((c) => c.profile_id))];

  const [customersRes, productsRes, courierProfilesRes] = await Promise.all([
    customerIds.length
      ? supabase.from("profiles").select("id, name, phone").in("id", customerIds)
      : Promise.resolve({ data: [], error: null }),
    productIds.length
      ? supabase.from("products").select("id, name").in("id", productIds)
      : Promise.resolve({ data: [], error: null }),
    courierProfileIds.length
      ? supabase.from("profiles").select("id, name, phone").in("id", courierProfileIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (customersRes.error) throw customersRes.error;
  if (productsRes.error) throw productsRes.error;
  if (courierProfilesRes.error) throw courierProfilesRes.error;

  const customerMap = new Map((customersRes.data ?? []).map((c) => [c.id, c]));
  const productNameMap = new Map((productsRes.data ?? []).map((p) => [p.id, p.name]));
  const courierProfileMap = new Map((courierProfilesRes.data ?? []).map((p) => [p.id, p]));

  const itemsByOrder = new Map<string, { name: string; qty: number; price: number }[]>();
  for (const it of items) {
    const list = itemsByOrder.get(it.order_id) ?? [];
    list.push({
      name: productNameMap.get(it.product_id) ?? "Producto",
      qty: it.quantity,
      price: it.unit_price,
    });
    itemsByOrder.set(it.order_id, list);
  }

  const mappedOrders: Order[] = orders.map((o) => {
    const customer = customerMap.get(o.customer_id);
    return {
      id: o.id,
      orderNumber: o.order_number,
      customer: customer?.name ?? "Cliente",
      phone: customer?.phone ?? "—",
      address: o.address,
      time: toLocalTime(o.created_at),
      date: toLocalDate(o.created_at),
      items: itemsByOrder.get(o.id) ?? [],
      delivery: o.delivery_fee,
      status: o.status as OrderStatus,
      courierId: o.courier_id,
      assignedAt: o.assigned_at ? toLocalTime(o.assigned_at) : null,
      note: o.note ?? undefined,
      route: {
        from: { x: o.route_from_x ?? 20, y: o.route_from_y ?? 75 },
        to: { x: o.route_to_x ?? 80, y: o.route_to_y ?? 20 },
      },
    };
  });

  const activeByCourier = new Map<string, number>();
  const lastActivityByCourier = new Map<string, string>();
  for (const o of orders) {
    if (!o.courier_id) continue;
    if (o.status === "listo" || o.status === "en_camino") {
      activeByCourier.set(o.courier_id, (activeByCourier.get(o.courier_id) ?? 0) + 1);
    }
    const prev = lastActivityByCourier.get(o.courier_id);
    if (o.assigned_at && (!prev || o.assigned_at > prev)) {
      lastActivityByCourier.set(o.courier_id, o.assigned_at);
    }
  }

  const mappedCouriers: Courier[] = courierRows.map((c) => {
    const p = courierProfileMap.get(c.profile_id);
    return {
      id: c.id,
      name: p?.name ?? "Repartidor",
      status: c.status as Courier["status"],
      vehicle: c.vehicle,
      distanceKm: c.distance_km ?? 0,
      activeOrders: activeByCourier.get(c.id) ?? 0,
      lastActivity: relativeTime(lastActivityByCourier.get(c.id)),
      rating: c.rating ?? 5,
      phone: p?.phone ?? "—",
    };
  });

  const orderByIdForHistory = new Map(orders.map((o) => [o.id, o]));
  const activity: ActivityEvent[] = history.map((h) => {
    const order = orderByIdForHistory.get(h.order_id);
    const status = h.status as OrderStatus;
    const kind: ActivityEvent["kind"] =
      status === "recibido" ? "nuevo" : status === "entregado" ? "entrega" : "estado";
    return {
      id: h.id,
      message: `Pedido ${order?.order_number ?? h.order_id.slice(0, 8)} · ${STATUS_LABEL[status] ?? status}`,
      time: toLocalTime(h.created_at),
      kind,
    };
  });

  return { orders: mappedOrders, couriers: mappedCouriers, activity };
}

export function FoodPleaseProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const isRestaurantRole = profile?.role === "restaurante";

  const restaurantQuery = useQuery({
    queryKey: ["my-restaurant", profile?.id],
    enabled: isRestaurantRole && !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data as RestaurantRow | null;
    },
  });

  const restaurant = restaurantQuery.data ?? null;

  const dashboardQuery = useQuery({
    queryKey: ["restaurant-dashboard", restaurant?.id],
    enabled: !!restaurant,
    queryFn: () => loadDashboardData(restaurant!),
    refetchInterval: 15000,
  });

  const invalidateDashboard = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["restaurant-dashboard", restaurant?.id] });
  }, [queryClient, restaurant?.id]);

  const orders = useMemo(() => dashboardQuery.data?.orders ?? [], [dashboardQuery.data]);
  const couriers = useMemo(() => dashboardQuery.data?.couriers ?? [], [dashboardQuery.data]);
  const activity = useMemo(() => dashboardQuery.data?.activity ?? [], [dashboardQuery.data]);

  const [products, setProducts] = useState<Product[]>(PRODUCTS);

  // isOpen / notifyNewOrders / notifyStatusChanges no tienen columna en Supabase
  // todavía: siguen siendo preferencia local del panel (no se guardan en el servidor).
  const [localSettings, setLocalSettings] = useState({
    isOpen: DEFAULT_SETTINGS.isOpen,
    notifyNewOrders: DEFAULT_SETTINGS.notifyNewOrders,
    notifyStatusChanges: DEFAULT_SETTINGS.notifyStatusChanges,
  });

  const settings = useMemo<Settings>(
    () => ({
      name: restaurant?.name ?? DEFAULT_SETTINGS.name,
      address: restaurant?.address ?? DEFAULT_SETTINGS.address,
      phone: restaurant?.phone ?? DEFAULT_SETTINGS.phone,
      schedule: restaurant?.schedule ?? DEFAULT_SETTINGS.schedule,
      ...localSettings,
    }),
    [restaurant, localSettings],
  );

  const advanceStatus = useCallback(
    (orderId: string) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;
      const idx = ORDER_FLOW.indexOf(order.status);
      if (idx >= ORDER_FLOW.length - 1) return;
      const next = ORDER_FLOW[idx + 1] as OrderStatus;

      void (async () => {
        const { error: updateError } = await supabase
          .from("orders")
          .update({ status: next })
          .eq("id", orderId);
        if (updateError) {
          console.error("[foodplease] error avanzando estado", updateError);
          toast.error("No pudimos actualizar el pedido", { description: updateError.message });
          return;
        }
        const { error: historyError } = await supabase
          .from("order_status_history")
          .insert({ order_id: orderId, status: next });
        if (historyError) console.error("[foodplease] error registrando historial", historyError);

        toast.success(`Pedido ${order.orderNumber ?? order.id} · ${STATUS_LABEL[next]}`, {
          description: "El estado se actualizó en toda la operación.",
        });
        invalidateDashboard();
      })();
    },
    [orders, invalidateDashboard],
  );

  const assignCourier = useCallback(
    (orderId: string, courierId: string) => {
      const courier = couriers.find((c) => c.id === courierId);
      if (!courier) return;

      void (async () => {
        const { error: updateError } = await supabase
          .from("orders")
          .update({ courier_id: courierId, assigned_at: new Date().toISOString() })
          .eq("id", orderId);
        if (updateError) {
          console.error("[foodplease] error asignando repartidor", updateError);
          toast.error("No pudimos asignar el repartidor", { description: updateError.message });
          return;
        }
        await supabase.from("couriers").update({ status: "en_entrega" }).eq("id", courierId);
        toast.success(`${courier.name} asignado al pedido`);
        invalidateDashboard();
      })();
    },
    [couriers, invalidateDashboard],
  );

  const getCourier = useCallback(
    (id: string | null) => (id ? couriers.find((c) => c.id === id) : undefined),
    [couriers],
  );

  const toggleProduct = useCallback(
    (productId: string) => {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p;
          toast(p.available ? `${p.name} desactivado` : `${p.name} disponible`, {
            description: p.available
              ? "Ya no aparecerá en la app móvil."
              : "El producto vuelve a estar visible para los clientes.",
          });
          return { ...p, available: !p.available };
        }),
      );
    },
    [setProducts],
  );

  const addProduct = useCallback(
    (p: Omit<Product, "id" | "emoji">) => {
      setProducts((prev) => [
        ...prev,
        { ...p, id: `P-${String(prev.length + 1).padStart(2, "0")}`, emoji: "🍽️" },
      ]);
      toast.success(`${p.name} agregado al menú`);
    },
    [setProducts],
  );

  const updateProduct = useCallback(
    (id: string, patch: Partial<Product>) => {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      toast.success("Producto actualizado");
    },
    [setProducts],
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      const restaurantPatch: Partial<
        Pick<RestaurantRow, "name" | "address" | "phone" | "schedule">
      > = {};
      if (patch.name !== undefined) restaurantPatch.name = patch.name;
      if (patch.address !== undefined) restaurantPatch.address = patch.address;
      if (patch.phone !== undefined) restaurantPatch.phone = patch.phone;
      if (patch.schedule !== undefined) restaurantPatch.schedule = patch.schedule;

      if (Object.keys(restaurantPatch).length > 0 && restaurant) {
        void (async () => {
          const { error } = await supabase
            .from("restaurants")
            .update(restaurantPatch)
            .eq("id", restaurant.id);
          if (error) {
            console.error("[foodplease] error actualizando restaurante", error);
            toast.error("No pudimos guardar los cambios", { description: error.message });
            return;
          }
          queryClient.invalidateQueries({ queryKey: ["my-restaurant", profile?.id] });
        })();
      }

      const { isOpen, notifyNewOrders, notifyStatusChanges } = patch;
      const hasLocalPatch =
        isOpen !== undefined || notifyNewOrders !== undefined || notifyStatusChanges !== undefined;
      if (hasLocalPatch) {
        setLocalSettings((prev) => ({
          ...prev,
          ...(isOpen !== undefined ? { isOpen } : {}),
          ...(notifyNewOrders !== undefined ? { notifyNewOrders } : {}),
          ...(notifyStatusChanges !== undefined ? { notifyStatusChanges } : {}),
        }));
      }
    },
    [restaurant, queryClient, profile?.id],
  );

  const value = useMemo<Store>(
    () => ({
      orders,
      couriers,
      products,
      activity,
      settings,
      loading: isRestaurantRole && (restaurantQuery.isLoading || dashboardQuery.isLoading),
      restaurantId: restaurant?.id ?? null,
      advanceStatus,
      assignCourier,
      toggleProduct,
      addProduct,
      updateProduct,
      updateSettings,
      getCourier,
    }),
    [
      orders,
      couriers,
      products,
      activity,
      settings,
      isRestaurantRole,
      restaurantQuery.isLoading,
      dashboardQuery.isLoading,
      restaurant?.id,
      advanceStatus,
      assignCourier,
      toggleProduct,
      addProduct,
      updateProduct,
      updateSettings,
      getCourier,
    ],
  );

  return <FoodPleaseContext.Provider value={value}>{children}</FoodPleaseContext.Provider>;
}

export function useFoodPlease() {
  const ctx = useContext(FoodPleaseContext);
  if (!ctx) throw new Error("useFoodPlease debe usarse dentro de FoodPleaseProvider");
  return ctx;
}

/** Métricas derivadas del estado actual, compartidas entre páginas. */
export function useMetrics() {
  const { orders } = useFoodPlease();
  const todayStr = toLocalDate(new Date().toISOString());
  const today = orders.filter((o) => o.date === todayStr);
  return {
    todayCount: today.length,
    pending: today.filter((o) => o.status === "recibido").length,
    preparing: today.filter((o) => o.status === "preparacion").length,
    onRoute: today.filter((o) => o.status === "en_camino").length,
    delivered: today.filter((o) => o.status === "entregado").length,
    sales: today.reduce(
      (acc, o) => acc + o.items.reduce((a, i) => a + i.price * i.qty, 0) + o.delivery,
      0,
    ),
  };
}

export type { Settings, OrderStatus };
