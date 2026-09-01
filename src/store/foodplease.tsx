import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import {
  COURIERS,
  INITIAL_ACTIVITY,
  ORDERS,
  PRODUCTS,
  RESTAURANT,
} from "@/data/mock";
import {
  ORDER_FLOW,
  STATUS_LABEL,
  totalOf,
  type ActivityEvent,
  type Courier,
  type Order,
  type OrderStatus,
  type Product,
} from "@/data/types";

/**
 * Estado local del MVP. Este store concentra toda la mutación de datos para
 * que más adelante sea reemplazable por llamadas a una API REST sin tocar la UI.
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
  advanceStatus: (orderId: string) => void;
  assignCourier: (orderId: string, courierId: string) => void;
  toggleProduct: (productId: string) => void;
  addProduct: (p: Omit<Product, "id" | "emoji">) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  getCourier: (id: string | null) => Courier | undefined;
}

const FoodPleaseContext = createContext<Store | null>(null);

const nowTime = () =>
  new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

export function FoodPleaseProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(ORDERS);
  const [couriers, setCouriers] = useState<Courier[]>(COURIERS);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [activity, setActivity] = useState<ActivityEvent[]>(INITIAL_ACTIVITY);
  const [settings, setSettings] = useState<Settings>({
    name: RESTAURANT.name,
    address: RESTAURANT.address,
    phone: RESTAURANT.phone,
    schedule: RESTAURANT.schedule,
    isOpen: true,
    notifyNewOrders: true,
    notifyStatusChanges: true,
  });

  const pushActivity = useCallback((message: string, kind: ActivityEvent["kind"]) => {
    setActivity((prev) => [
      { id: `${Date.now()}-${Math.random()}`, message, time: nowTime(), kind },
      ...prev,
    ]);
  }, []);

  const advanceStatus = useCallback(
    (orderId: string) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const idx = ORDER_FLOW.indexOf(o.status);
          if (idx >= ORDER_FLOW.length - 1) return o;
          const next = ORDER_FLOW[idx + 1] as OrderStatus;
          pushActivity(
            next === "entregado"
              ? `Pedido #${o.id} fue entregado`
              : `Pedido #${o.id} pasó a ${STATUS_LABEL[next]}`,
            next === "entregado" ? "entrega" : "estado",
          );
          toast.success(`Pedido #${o.id} · ${STATUS_LABEL[next]}`, {
            description: "El estado se actualizó en toda la operación.",
          });
          return { ...o, status: next };
        }),
      );
    },
    [pushActivity],
  );

  const assignCourier = useCallback(
    (orderId: string, courierId: string) => {
      const courier = couriers.find((c) => c.id === courierId);
      if (!courier) return;
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, courierId, assignedAt: nowTime() } : o,
        ),
      );
      setCouriers((prev) =>
        prev.map((c) =>
          c.id === courierId
            ? {
                ...c,
                status: "en_entrega",
                activeOrders: c.activeOrders + 1,
                lastActivity: "Hace instantes",
              }
            : c,
        ),
      );
      pushActivity(`Repartidor asignado al pedido #${orderId}`, "repartidor");
      toast.success(`${courier.name} asignado al pedido #${orderId}`);
    },
    [couriers, pushActivity],
  );

  const toggleProduct = useCallback((productId: string) => {
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
  }, []);

  const addProduct = useCallback((p: Omit<Product, "id" | "emoji">) => {
    setProducts((prev) => [
      ...prev,
      { ...p, id: `P-${String(prev.length + 1).padStart(2, "0")}`, emoji: "🍽️" },
    ]);
    toast.success(`${p.name} agregado al menú`);
  }, []);

  const updateProduct = useCallback((id: string, patch: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    toast.success("Producto actualizado");
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const getCourier = useCallback(
    (id: string | null) => (id ? couriers.find((c) => c.id === id) : undefined),
    [couriers],
  );

  const value = useMemo<Store>(
    () => ({
      orders,
      couriers,
      products,
      activity,
      settings,
      loading: false,
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
      advanceStatus,
      assignCourier,
      toggleProduct,
      addProduct,
      updateProduct,
      updateSettings,
      getCourier,
    ],
  );

  return (
    <FoodPleaseContext.Provider value={value}>{children}</FoodPleaseContext.Provider>
  );
}

export function useFoodPlease() {
  const ctx = useContext(FoodPleaseContext);
  if (!ctx) throw new Error("useFoodPlease debe usarse dentro de FoodPleaseProvider");
  return ctx;
}

/** Métricas derivadas del estado actual, compartidas entre páginas. */
export function useMetrics() {
  const { orders } = useFoodPlease();
  const today = orders.filter((o) => o.date === "2026-09-01");
  return {
    todayCount: today.length,
    pending: today.filter((o) => o.status === "recibido").length,
    preparing: today.filter((o) => o.status === "preparacion").length,
    onRoute: today.filter((o) => o.status === "en_camino").length,
    delivered: today.filter((o) => o.status === "entregado").length,
    sales: today.reduce((acc, o) => acc + totalOf(o), 0),
  };
}

export type { Settings, OrderStatus };
