import { Bike, MapPin, Store } from "lucide-react";

import type { Courier, Order } from "@/data/types";

/**
 * Representación esquemática del flujo logístico (A → B).
 * No es GPS real ni navegación productiva: usa coordenadas simuladas.
 */
export function DeliveryMap({
  order,
  courier,
}: {
  order: Pick<Order, "route" | "status" | "address">;
  courier?: Pick<Courier, "name" | "vehicle" | "distanceKm">;
}) {
  const { from, to } = order.route;
  const mid = { x: (from.x + to.x) / 2 + 8, y: (from.y + to.y) / 2 - 12 };
  const progress = order.status === "entregado" ? 1 : order.status === "en_camino" ? 0.55 : 0.12;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <p className="text-sm font-semibold">Ruta de entrega</p>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          Representación simulada · sin GPS real
        </span>
      </div>

      <div className="relative aspect-[16/9] w-full bg-muted/60">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full"
        >
          <defs>
            <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M8 0H0V8" fill="none" stroke="var(--border)" strokeWidth="0.4" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          <path
            d="M0 34 H100 M0 68 H100 M28 0 V100 M66 0 V100"
            stroke="var(--border)"
            strokeWidth="1.6"
            fill="none"
          />
          <path
            d={`M ${from.x} ${from.y} Q ${mid.x} ${mid.y} ${to.x} ${to.y}`}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeDasharray="4 3"
          />
          <path
            d={`M ${from.x} ${from.y} Q ${mid.x} ${mid.y} ${to.x} ${to.y}`}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1.6"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={`${progress} 1`}
          />
        </svg>

        <Marker x={from.x} y={from.y} label="A · Restaurante" tone="dark">
          <Store className="size-3.5" />
        </Marker>
        <Marker x={to.x} y={to.y} label={`B · ${order.address}`} tone="primary">
          <MapPin className="size-3.5" />
        </Marker>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-3 text-sm">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-accent-foreground">
          <Bike className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold">
            {courier ? courier.name : "Repartidor no asignado"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {courier
              ? `${courier.vehicle} · ${courier.distanceKm} km del restaurante`
              : "Asigna un repartidor para simular el trayecto"}
          </p>
        </div>
      </div>
    </div>
  );
}

function Marker({
  x,
  y,
  label,
  tone,
  children,
}: {
  x: number;
  y: number;
  label: string;
  tone: "dark" | "primary";
  children: React.ReactNode;
}) {
  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <span
        className={`grid size-7 place-items-center rounded-full shadow-soft ${
          tone === "primary"
            ? "bg-primary text-primary-foreground"
            : "bg-foreground text-background"
        }`}
      >
        {children}
      </span>
      <span className="max-w-[9rem] truncate rounded-full bg-card px-2 py-0.5 text-[11px] font-medium shadow-card">
        {label}
      </span>
    </div>
  );
}
