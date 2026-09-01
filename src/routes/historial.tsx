import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { StatusBadge } from "@/components/foodplease/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCLP, ORDER_FLOW, STATUS_LABEL, totalOf, type OrderStatus } from "@/data/types";
import { useFoodPlease } from "@/store/foodplease";

export const Route = createFileRoute("/historial")({
  head: () => ({
    meta: [
      { title: "Historial de pedidos | FoodPlease" },
      {
        name: "description",
        content:
          "Revisa el historial completo de pedidos con filtros por fecha, estado final y cliente.",
      },
      { property: "og:title", content: "Historial de pedidos | FoodPlease" },
      {
        property: "og:description",
        content: "Trazabilidad de cada entrega realizada por el restaurante.",
      },
    ],
  }),
  component: HistorialPage,
});

function HistorialPage() {
  const { orders, getCourier } = useFoodPlease();
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<OrderStatus | "todos">("todos");
  const [customer, setCustomer] = useState("");

  const rows = useMemo(
    () =>
      orders.filter((o) => {
        if (date && o.date !== date) return false;
        if (status !== "todos" && o.status !== status) return false;
        if (customer && !o.customer.toLowerCase().includes(customer.trim().toLowerCase()))
          return false;
        return true;
      }),
    [orders, date, status, customer],
  );

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h2 className="text-2xl font-extrabold tracking-tight">Historial</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Registro de pedidos de la operación con su estado final.
        </p>
      </header>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="Cliente"
            aria-label="Filtrar por cliente"
            className="rounded-xl pl-9"
          />
        </div>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Filtrar por fecha"
          className="rounded-xl"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus | "todos")}
          aria-label="Filtrar por estado"
          className="h-9 rounded-xl border border-input bg-card px-3 text-sm"
        >
          <option value="todos">Todos los estados</option>
          {ORDER_FLOW.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-semibold">Sin resultados en el historial</p>
          <p className="mt-1 text-sm text-muted-foreground">Prueba con otros filtros.</p>
          <Button
            variant="outline"
            className="mt-4 rounded-xl"
            onClick={() => {
              setDate("");
              setStatus("todos");
              setCustomer("");
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-card lg:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs text-muted-foreground uppercase">
                <tr>
                  {["Pedido", "Fecha", "Cliente", "Total", "Repartidor", "Estado final"].map((h) => (
                    <th key={h} className="px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/40">
                    <td className="px-4 py-3 font-semibold">#{o.id}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {o.date} · {o.time}
                    </td>
                    <td className="px-4 py-3">{o.customer}</td>
                    <td className="px-4 py-3 font-medium">{formatCLP(totalOf(o))}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {getCourier(o.courierId)?.name ?? "Sin asignar"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col gap-3 lg:hidden">
            {rows.map((o) => (
              <li key={o.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold">#{o.id}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {o.customer} · {o.date}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="truncate text-muted-foreground">
                    {getCourier(o.courierId)?.name ?? "Sin asignar"}
                  </span>
                  <span className="font-semibold">{formatCLP(totalOf(o))}</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
