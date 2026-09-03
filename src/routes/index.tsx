import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bike,
  CheckCircle2,
  ChefHat,
  Clock,
  DollarSign,
  ReceiptText,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { OrderDetailPanel } from "@/components/foodplease/OrderDetailPanel";
import { StatusBadge } from "@/components/foodplease/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatCLP, totalOf, type ActivityEvent } from "@/data/types";
import { useFoodPlease, useMetrics } from "@/store/foodplease";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard operativo | FoodPlease Restaurantes" },
      {
        name: "description",
        content:
          "Panel web de FoodPlease: resumen de pedidos del día, ventas, actividad reciente y coordinación con repartidores.",
      },
      { property: "og:title", content: "Dashboard operativo | FoodPlease Restaurantes" },
      {
        property: "og:description",
        content: "Visualiza pedidos, estados y métricas del restaurante en un solo panel moderno.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { orders, activity, getCourier } = useFoodPlease();
  const m = useMetrics();
  const [selected, setSelected] = useState<string | null>(null);
  const recent = orders.slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-extrabold tracking-tight">Dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">Resumen de la operación de hoy</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={ReceiptText}
          label="Pedidos de hoy"
          value={String(m.todayCount)}
          hint={`${m.delivered} entregados`}
        />
        <Metric
          icon={Clock}
          label="Pedidos pendientes"
          value={String(m.pending)}
          hint="Esperando confirmación"
          tone="warning"
        />
        <Metric
          icon={ChefHat}
          label="En preparación"
          value={String(m.preparing)}
          hint="En cocina ahora"
          tone="primary"
        />
        <Metric
          icon={DollarSign}
          label="Ventas del día"
          value={formatCLP(m.sales)}
          hint={`${m.onRoute} pedidos en camino`}
          tone="success"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3.5">
            <h3 className="truncate text-sm font-bold">Pedidos recientes</h3>
            <Button asChild variant="ghost" size="sm" className="shrink-0 rounded-lg text-primary">
              <Link to="/pedidos">Ver todos</Link>
            </Button>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[54rem] text-sm">
              <thead className="bg-muted/60 text-left text-xs text-muted-foreground uppercase">
                <tr>
                  {["Pedido", "Cliente", "Hora", "Total", "Estado", "Repartidor", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/40">
                    <td className="px-4 py-3 font-semibold">#{o.orderNumber ?? o.id}</td>
                    <td className="px-4 py-3">{o.customer}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.time}</td>
                    <td className="px-4 py-3 font-medium">{formatCLP(totalOf(o))}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {getCourier(o.courierId)?.name ?? "Sin asignar"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg text-primary"
                        onClick={() => setSelected(o.id)}
                      >
                        Ver detalle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col divide-y divide-border lg:hidden">
            {recent.map((o) => (
              <li key={o.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold">#{o.orderNumber ?? o.id}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {o.customer} · {o.time}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold">{formatCLP(totalOf(o))}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => setSelected(o.id)}
                  >
                    Ver detalle
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <h3 className="text-sm font-bold">Actividad reciente</h3>
          <ol className="mt-4 flex flex-col gap-4">
            {activity.slice(0, 8).map((e) => (
              <li key={e.id} className="flex gap-3">
                <ActivityIcon kind={e.kind} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{e.message}</p>
                  <p className="text-xs text-muted-foreground">{e.time}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <OrderDetailPanel orderId={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}

function ActivityIcon({ kind }: { kind: ActivityEvent["kind"] }) {
  const map = {
    nuevo: { Icon: ReceiptText, cls: "bg-info-soft text-info" },
    estado: { Icon: ChefHat, cls: "bg-warning-soft text-warning-foreground" },
    repartidor: { Icon: Bike, cls: "bg-primary-soft text-accent-foreground" },
    entrega: { Icon: CheckCircle2, cls: "bg-success-soft text-success" },
  } as const;
  const { Icon, cls } = map[kind];
  return (
    <span className={`grid size-8 shrink-0 place-items-center rounded-full ${cls}`} aria-hidden>
      <Icon className="size-4" />
    </span>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  hint,
  tone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  tone?: "neutral" | "primary" | "success" | "warning";
}) {
  const tones = {
    neutral: "bg-muted text-muted-foreground",
    primary: "bg-primary-soft text-accent-foreground",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning-foreground",
  } as const;
  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <p className="min-w-0 truncate text-sm font-medium text-muted-foreground">{label}</p>
        <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>
    </article>
  );
}
