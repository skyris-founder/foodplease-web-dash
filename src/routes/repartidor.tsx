import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bike, ChefHat, CheckCircle2, Loader2, LogOut, MapPin, Package, Store } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DeliveryMap } from "@/components/foodplease/DeliveryMap";
import { StatusBadge } from "@/components/foodplease/StatusBadge";
import { formatCLP, type OrderStatus } from "@/data/types";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { cn, getErrorMessage } from "@/lib/utils";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/repartidor")({
  component: RepartidorApp,
});

type CourierRow = Tables<"couriers">;
type OrderRow = Tables<"orders">;
type Restaurant = Tables<"restaurants">;

type Tab = "disponibles" | "mis-entregas";

function useCourier(profileId: string | undefined) {
  return useQuery({
    queryKey: ["courier", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("couriers")
        .select("*")
        .eq("profile_id", profileId!)
        .maybeSingle();
      if (error) throw error;
      return data as CourierRow | null;
    },
  });
}

function useAvailableOrders() {
  return useQuery({
    queryKey: ["orders-available"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "listo")
        .is("courier_id", null)
        .order("created_at");
      if (error) throw error;
      return data as OrderRow[];
    },
    refetchInterval: 15000,
  });
}

function useMyDeliveries(courierId: string | undefined) {
  return useQuery({
    queryKey: ["orders-mine", courierId],
    enabled: !!courierId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("courier_id", courierId!)
        .in("status", ["listo", "en_camino"])
        .order("assigned_at");
      if (error) throw error;
      return data as OrderRow[];
    },
    refetchInterval: 15000,
  });
}

function useRestaurantsMap() {
  return useQuery({
    queryKey: ["restaurants-map"],
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurants").select("*");
      if (error) throw error;
      const map = new Map<string, Restaurant>();
      for (const r of data as Restaurant[]) map.set(r.id, r);
      return map;
    },
  });
}

function toMapOrder(o: OrderRow) {
  return {
    route: {
      from: { x: o.route_from_x ?? 20, y: o.route_from_y ?? 75 },
      to: { x: o.route_to_x ?? 80, y: o.route_to_y ?? 20 },
    },
    status: o.status as OrderStatus,
    address: o.address,
  };
}

function RepartidorHeader() {
  const { profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
          <ChefHat className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-base leading-tight font-extrabold tracking-tight">
            Food<span className="text-primary">Please</span>
          </span>
          <span className="block truncate text-[11px] font-medium text-muted-foreground">
            Hola, {profile?.name ?? "repartidor"}
          </span>
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 rounded-xl text-muted-foreground"
        onClick={() => signOut()}
        aria-label="Cerrar sesión"
      >
        <LogOut className="size-4" />
      </Button>
    </header>
  );
}

function NoCourierProfile() {
  const { signOut } = useAuth();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <Bike className="size-6" />
      </span>
      <div>
        <h1 className="text-lg font-bold">Cuenta sin perfil de repartidor</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Tu usuario tiene rol de repartidor, pero todavía no tiene una fila vinculada en la tabla{" "}
          <code className="rounded bg-muted px-1 py-0.5">couriers</code>. Pide al administrador que
          la cree.
        </p>
      </div>
      <Button variant="outline" className="rounded-xl" onClick={() => signOut()}>
        Cerrar sesión
      </Button>
    </div>
  );
}

function AvailableOrderCard({
  order,
  restaurant,
  onAccept,
  isAccepting,
}: {
  order: OrderRow;
  restaurant: Restaurant | undefined;
  onAccept: () => void;
  isAccepting: boolean;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">Pedido {order.order_number}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Store className="size-3.5 shrink-0" />
            {restaurant?.name ?? "Restaurante"}
          </p>
        </div>
        <span className="shrink-0 font-bold text-primary">{formatCLP(order.total)}</span>
      </div>
      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
        <MapPin className="size-3.5 shrink-0" />
        Entregar en {order.address}
      </p>
      <Button size="sm" className="rounded-lg" disabled={isAccepting} onClick={onAccept}>
        {isAccepting ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Aceptando…
          </>
        ) : (
          "Aceptar entrega"
        )}
      </Button>
    </li>
  );
}

function MyDeliveryCard({
  order,
  restaurant,
  onAdvance,
  isUpdating,
}: {
  order: OrderRow;
  restaurant: Restaurant | undefined;
  onAdvance: () => void;
  isUpdating: boolean;
}) {
  const nextLabel = order.status === "listo" ? "Marcar en camino" : "Marcar entregado";

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">Pedido {order.order_number}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Store className="size-3.5 shrink-0" />
            {restaurant?.name ?? "Restaurante"}
          </p>
        </div>
        <StatusBadge status={order.status as OrderStatus} />
      </div>

      <DeliveryMap order={toMapOrder(order)} />

      <Button size="sm" className="rounded-lg" disabled={isUpdating} onClick={onAdvance}>
        {isUpdating ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Actualizando…
          </>
        ) : (
          <>
            <CheckCircle2 className="size-4" /> {nextLabel}
          </>
        )}
      </Button>
    </li>
  );
}

function RepartidorApp() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("disponibles");
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  const { data: courier, isLoading: courierLoading } = useCourier(profile?.id);
  const { data: available, isLoading: availableLoading } = useAvailableOrders();
  const { data: mine, isLoading: mineLoading } = useMyDeliveries(courier?.id);
  const { data: restaurants } = useRestaurantsMap();

  const invalidateOrders = () => {
    queryClient.invalidateQueries({ queryKey: ["orders-available"] });
    queryClient.invalidateQueries({ queryKey: ["orders-mine"] });
  };

  const acceptMutation = useMutation({
    mutationFn: async (order: OrderRow) => {
      if (!courier) throw new Error("No hay perfil de repartidor vinculado.");
      const { error } = await supabase
        .from("orders")
        .update({ courier_id: courier.id, assigned_at: new Date().toISOString() })
        .eq("id", order.id);
      if (error) throw error;
      await supabase.from("couriers").update({ status: "en_entrega" }).eq("id", courier.id);
    },
    onSuccess: () => {
      toast.success("Entrega aceptada");
      invalidateOrders();
      setTab("mis-entregas");
    },
    onError: (err) => {
      console.error("[repartidor] error aceptando pedido", err);
      toast.error("No pudimos asignarte este pedido", {
        description: getErrorMessage(err),
      });
    },
    onSettled: () => setBusyOrderId(null),
  });

  const advanceMutation = useMutation({
    mutationFn: async (order: OrderRow) => {
      const nextStatus: OrderStatus = order.status === "listo" ? "en_camino" : "entregado";
      const { error: updateError } = await supabase
        .from("orders")
        .update({ status: nextStatus })
        .eq("id", order.id);
      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from("order_status_history")
        .insert({ order_id: order.id, status: nextStatus });
      if (historyError) throw historyError;

      if (nextStatus === "entregado" && courier) {
        await supabase.from("couriers").update({ status: "disponible" }).eq("id", courier.id);
      }
    },
    onSuccess: () => {
      toast.success("Estado actualizado");
      invalidateOrders();
    },
    onError: (err) => {
      console.error("[repartidor] error actualizando pedido", err);
      toast.error("No pudimos actualizar este pedido", {
        description: getErrorMessage(err),
      });
    },
    onSettled: () => setBusyOrderId(null),
  });

  if (courierLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <RepartidorHeader />
        <div className="p-4">
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!courier) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <RepartidorHeader />
        <NoCourierProfile />
      </div>
    );
  }

  const list = tab === "disponibles" ? (available ?? []) : (mine ?? []);
  const isLoading = tab === "disponibles" ? availableLoading : mineLoading;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <RepartidorHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 p-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-extrabold tracking-tight">Entregas</h1>
          <p className="text-sm text-muted-foreground">
            {courier.vehicle} · {courier.distance_km ?? 0} km de radio
          </p>
        </div>

        <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
          {(
            [
              { id: "disponibles", label: "Disponibles" },
              { id: "mis-entregas", label: "Mis entregas" },
            ] as { id: Tab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                tab === t.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {isLoading && (
            <div className="flex flex-col gap-3">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          )}

          {!isLoading && list.length === 0 && (
            <p className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              <Package className="size-6" />
              {tab === "disponibles"
                ? "No hay pedidos listos para retirar por ahora."
                : "No tienes entregas en curso."}
            </p>
          )}

          {!isLoading && list.length > 0 && (
            <ul className="flex flex-col gap-3">
              {list.map((order) =>
                tab === "disponibles" ? (
                  <AvailableOrderCard
                    key={order.id}
                    order={order}
                    restaurant={restaurants?.get(order.restaurant_id)}
                    isAccepting={acceptMutation.isPending && busyOrderId === order.id}
                    onAccept={() => {
                      setBusyOrderId(order.id);
                      acceptMutation.mutate(order);
                    }}
                  />
                ) : (
                  <MyDeliveryCard
                    key={order.id}
                    order={order}
                    restaurant={restaurants?.get(order.restaurant_id)}
                    isUpdating={advanceMutation.isPending && busyOrderId === order.id}
                    onAdvance={() => {
                      setBusyOrderId(order.id);
                      advanceMutation.mutate(order);
                    }}
                  />
                ),
              )}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
