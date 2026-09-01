import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { OrderDetailPanel } from "@/components/foodplease/OrderDetailPanel";
import { StatusBadge } from "@/components/foodplease/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCLP, ORDER_FLOW, STATUS_LABEL, totalOf, type OrderStatus } from "@/data/types";
import { cn } from "@/lib/utils";
import { useFoodPlease } from "@/store/foodplease";

export const Route = createFileRoute("/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos en curso | FoodPlease Restaurantes" },
      {
        name: "description",
        content:
          "Gestiona pedidos recibidos, en preparación, listos, en camino y entregados desde el panel web de FoodPlease.",
      },
      { property: "og:title", content: "Pedidos en curso | FoodPlease Restaurantes" },
      {
        property: "og:description",
        content: "Filtra, revisa el detalle y avanza el estado de cada pedido en tiempo real.",
      },
    ],
  }),
  component: PedidosPage,
});

const FILTERS: Array<{ value: OrderStatus | "todos"; label: string }> = [
  { value: "todos", label: "Todos" },
  ...ORDER_FLOW.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
];

function PedidosPage() {
  const { orders, getCourier } = useFoodPlease();
  const [filter, setFilter] = useState<OrderStatus | "todos">("todos");
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        if (filter !== "todos" && o.status !== filter) return false;
        if (date && o.date !== date) return false;
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return o.id.includes(q) || o.customer.toLowerCase().includes(q);
      }),
    [orders, filter, query, date],
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-extrabold tracking-tight">Pedidos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Controla el flujo completo de la operación, desde la recepción hasta la entrega.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por número de pedido o cliente"
              aria-label="Buscar pedidos"
              className="rounded-xl pl-9"
            />
          </div>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Filtrar por fecha"
            className="rounded-xl sm:w-48"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-semibold">No hay pedidos que coincidan</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajusta los filtros o limpia la búsqueda para ver más resultados.
          </p>
          <Button
            variant="outline"
            className="mt-4 rounded-xl"
            onClick={() => {
              setFilter("todos");
              setQuery("");
              setDate("");
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      ) : (
        <>
          {/* Tabla en desktop */}
          <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card shadow-card lg:block">
            <table className="w-full min-w-[54rem] text-sm">
              <thead className="bg-muted/60 text-left text-xs text-muted-foreground uppercase">
                <tr>
                  {["Pedido", "Cliente", "Hora", "Productos", "Total", "Estado", "Repartidor", ""].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 font-semibold">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/40">
                    <td className="px-4 py-3 font-semibold">#{o.id}</td>
                    <td className="px-4 py-3">{o.customer}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.time}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {o.items.reduce((a, i) => a + i.qty, 0)} ítems
                    </td>
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

          {/* Cards en tablet/móvil */}
          <ul className="flex flex-col gap-3 lg:hidden">
            {filtered.map((o) => (
              <li
                key={o.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold">#{o.id}</p>
                    <p className="truncate text-sm text-muted-foreground">{o.customer}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <Field label="Hora" value={o.time} />
                  <Field label="Total" value={formatCLP(totalOf(o))} />
                  <Field label="Productos" value={`${o.items.reduce((a, i) => a + i.qty, 0)} ítems`} />
                  <Field label="Repartidor" value={getCourier(o.courierId)?.name ?? "Sin asignar"} />
                </dl>
                <Button
                  variant="outline"
                  className="mt-3 w-full rounded-xl"
                  onClick={() => setSelected(o.id)}
                >
                  Ver detalle
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}

      <OrderDetailPanel orderId={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium">{value}</dd>
    </div>
  );
}
