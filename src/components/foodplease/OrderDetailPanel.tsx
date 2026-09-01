import { Check, Clock, MapPin, Phone, User } from "lucide-react";
import { useState } from "react";

import { DeliveryMap } from "./DeliveryMap";
import { StatusBadge, CourierBadge } from "./StatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  formatCLP,
  NEXT_ACTION_LABEL,
  ORDER_FLOW,
  STATUS_LABEL,
  subtotalOf,
  totalOf,
  type Order,
} from "@/data/types";
import { cn } from "@/lib/utils";
import { useFoodPlease } from "@/store/foodplease";

export function OrderDetailPanel({
  orderId,
  onOpenChange,
}: {
  orderId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { orders } = useFoodPlease();
  const order = orders.find((o) => o.id === orderId) ?? null;

  return (
    <Sheet open={!!orderId} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl">
        {order ? (
          <>
            <SheetHeader className="border-b border-border p-5">
              <SheetTitle className="flex flex-wrap items-center gap-3 text-xl">
                Pedido #{order.id}
                <StatusBadge status={order.status} />
              </SheetTitle>
            </SheetHeader>
            <OrderDetailBody order={order} />
          </>
        ) : (
          <SheetHeader className="p-5">
            <SheetTitle>Pedido no disponible</SheetTitle>
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function OrderDetailBody({ order }: { order: Order }) {
  const { advanceStatus, assignCourier, couriers, getCourier } = useFoodPlease();
  const [assigning, setAssigning] = useState(false);
  const courier = getCourier(order.courierId);
  const nextLabel = NEXT_ACTION_LABEL[order.status];
  const available = couriers.filter((c) => c.status !== "fuera_servicio");

  return (
    <div className="flex flex-col gap-5 p-5">
      <section className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:grid-cols-2">
        <Info icon={<User className="size-4" />} label="Cliente" value={order.customer} />
        <Info icon={<Clock className="size-4" />} label="Hora" value={order.time} />
        <Info icon={<MapPin className="size-4" />} label="Dirección" value={order.address} />
        <Info icon={<Phone className="size-4" />} label="Teléfono" value={order.phone} />
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <h3 className="mb-3 text-sm font-bold">Productos</h3>
        <ul className="flex flex-col gap-2.5">
          {order.items.map((item) => (
            <li key={item.name} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">
                {item.name} <span className="text-muted-foreground">× {item.qty}</span>
              </span>
              <span className="shrink-0 font-medium">{formatCLP(item.price * item.qty)}</span>
            </li>
          ))}
        </ul>
        {order.note && (
          <p className="mt-3 rounded-xl bg-warning-soft px-3 py-2 text-xs font-medium text-warning-foreground">
            Nota: {order.note}
          </p>
        )}
        <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-sm">
          <Row label="Subtotal" value={formatCLP(subtotalOf(order))} />
          <Row label="Despacho" value={formatCLP(order.delivery)} />
          <div className="flex items-center justify-between pt-1 text-base font-bold">
            <span>Total</span>
            <span className="text-primary">{formatCLP(totalOf(order))}</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <h3 className="mb-4 text-sm font-bold">Estado del pedido</h3>
        <Timeline order={order} />
        {nextLabel && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="mt-4 w-full rounded-xl">{nextLabel}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar cambio de estado?</AlertDialogTitle>
                <AlertDialogDescription>
                  El pedido #{order.id} pasará al siguiente estado y el cliente verá la
                  actualización en la app móvil.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => advanceStatus(order.id)}>
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <h3 className="mb-3 text-sm font-bold">Repartidor</h3>
        {courier ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{courier.name}</p>
              <p className="text-xs text-muted-foreground">
                {courier.vehicle} · asignado a las {order.assignedAt}
              </p>
            </div>
            <CourierBadge status={courier.status} />
          </div>
        ) : assigning ? (
          <ul className="flex flex-col gap-2">
            {available.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.vehicle} · {c.distanceKm} km
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CourierBadge status={c.status} />
                  <Button
                    size="sm"
                    className="rounded-lg"
                    onClick={() => {
                      assignCourier(order.id, c.id);
                      setAssigning(false);
                    }}
                  >
                    Asignar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Buscando repartidor…</p>
            <Button variant="outline" className="rounded-xl" onClick={() => setAssigning(true)}>
              Asignar repartidor
            </Button>
          </div>
        )}
      </section>

      <DeliveryMap order={order} {...(courier ? { courier } : {})} />
    </div>
  );
}

function Timeline({ order }: { order: Order }) {
  const currentIdx = ORDER_FLOW.indexOf(order.status);
  return (
    <ol className="flex flex-col gap-0">
      {ORDER_FLOW.map((status, i) => {
        const done = i <= currentIdx;
        return (
          <li key={status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border text-[11px]",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              {i < ORDER_FLOW.length - 1 && (
                <span className={cn("w-px flex-1", done ? "bg-primary" : "bg-border")} />
              )}
            </div>
            <span
              className={cn(
                "pb-4 text-sm",
                done ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {STATUS_LABEL[status]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block truncate text-sm font-medium">{value}</span>
      </span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
