import { cn } from "@/lib/utils";
import {
  COURIER_STATUS_LABEL,
  STATUS_LABEL,
  type CourierStatus,
  type OrderStatus,
} from "@/data/types";

const orderStyles: Record<OrderStatus, string> = {
  recibido: "bg-info-soft text-info border-info/20",
  preparacion: "bg-warning-soft text-warning-foreground border-warning/30",
  listo: "bg-primary-soft text-accent-foreground border-primary/25",
  en_camino: "bg-secondary text-secondary-foreground border-border",
  entregado: "bg-success-soft text-success border-success/25",
};

const courierStyles: Record<CourierStatus, string> = {
  disponible: "bg-success-soft text-success border-success/25",
  en_entrega: "bg-warning-soft text-warning-foreground border-warning/30",
  fuera_servicio: "bg-muted text-muted-foreground border-border",
};

const base =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap";

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span className={cn(base, orderStyles[status], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function CourierBadge({
  status,
  className,
}: {
  status: CourierStatus;
  className?: string;
}) {
  return (
    <span className={cn(base, courierStyles[status], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {COURIER_STATUS_LABEL[status]}
    </span>
  );
}
