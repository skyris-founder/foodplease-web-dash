import { createFileRoute } from "@tanstack/react-router";
import { Bike, Phone, Star } from "lucide-react";
import { useState } from "react";

import { CourierBadge } from "@/components/foodplease/StatusBadge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatCLP, totalOf } from "@/data/types";
import { useFoodPlease } from "@/store/foodplease";

export const Route = createFileRoute("/repartidores")({
  head: () => ({
    meta: [
      { title: "Repartidores conectados | FoodPlease" },
      {
        name: "description",
        content:
          "Consulta disponibilidad, vehículo, pedidos activos y última actividad de los repartidores de FoodPlease.",
      },
      { property: "og:title", content: "Repartidores conectados | FoodPlease" },
      {
        property: "og:description",
        content: "Coordina las entregas con visibilidad completa del equipo de reparto.",
      },
    ],
  }),
  component: RepartidoresPage,
});

function RepartidoresPage() {
  const { couriers, orders } = useFoodPlease();
  const [selected, setSelected] = useState<string | null>(null);
  const courier = couriers.find((c) => c.id === selected);
  const courierOrders = orders.filter((o) => o.courierId === selected);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-extrabold tracking-tight">Repartidores</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Equipo de reparto simulado para el MVP académico de FoodPlease.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {couriers.map((c) => (
          <li key={c.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft text-accent-foreground">
                  <Bike className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.vehicle} · {c.distanceKm} km
                  </p>
                </div>
              </div>
              <CourierBadge status={c.status} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Pedidos actuales</dt>
                <dd className="font-semibold">{c.activeOrders}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Última actividad</dt>
                <dd className="truncate font-semibold">{c.lastActivity}</dd>
              </div>
            </dl>
            <Button
              variant="outline"
              className="mt-4 w-full rounded-xl"
              onClick={() => setSelected(c.id)}
            >
              Ver detalle
            </Button>
          </li>
        ))}
      </ul>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-md">
          {courier && (
            <>
              <SheetHeader className="border-b border-border p-5">
                <SheetTitle className="flex flex-wrap items-center gap-3 text-xl">
                  {courier.name}
                  <CourierBadge status={courier.status} />
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-5 p-5">
                <dl className="grid grid-cols-2 gap-4 rounded-2xl border border-border p-4 text-sm">
                  <Item label="Vehículo" value={courier.vehicle} />
                  <Item label="Distancia" value={`${courier.distanceKm} km`} />
                  <Item label="Pedidos activos" value={String(courier.activeOrders)} />
                  <Item label="Última actividad" value={courier.lastActivity} />
                </dl>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Star className="size-4 text-warning" /> {courier.rating}
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="size-4" /> {courier.phone}
                  </span>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-bold">Pedidos asignados</h3>
                  {courierOrders.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      Sin pedidos asignados por ahora.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {courierOrders.map((o) => (
                        <li
                          key={o.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm"
                        >
                          <span className="min-w-0 truncate">
                            <span className="font-semibold">#{o.id}</span> · {o.customer}
                          </span>
                          <span className="shrink-0 font-medium">{formatCLP(totalOf(o))}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-semibold">{value}</dd>
    </div>
  );
}
