import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useFoodPlease } from "@/store/foodplease";

export const Route = createFileRoute("/configuracion")({
  head: () => ({
    meta: [
      { title: "Configuración del restaurante | FoodPlease" },
      {
        name: "description",
        content:
          "Actualiza datos del local, horario, estado abierto/cerrado y preferencias de notificaciones.",
      },
      { property: "og:title", content: "Configuración del restaurante | FoodPlease" },
      {
        property: "og:description",
        content: "Preferencias operativas del panel web de FoodPlease.",
      },
    ],
  }),
  component: ConfiguracionPage,
});

function ConfiguracionPage() {
  const { settings, updateSettings } = useFoodPlease();
  const [draft, setDraft] = useState({
    name: settings.name,
    address: settings.address,
    phone: settings.phone,
    schedule: settings.schedule,
  });

  // Sincroniza el borrador cuando cargan (o cambian) los datos reales del restaurante.
  useEffect(() => {
    setDraft({
      name: settings.name,
      address: settings.address,
      phone: settings.phone,
      schedule: settings.schedule,
    });
  }, [settings.name, settings.address, settings.phone, settings.schedule]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <header>
        <h2 className="text-2xl font-extrabold tracking-tight">Configuración</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          La información del restaurante se guarda en Supabase. El estado abierto/cerrado y las
          preferencias de notificación son locales a este panel por ahora.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <h3 className="text-sm font-bold">Información del restaurante</h3>
        <form
          className="mt-4 grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            updateSettings(draft);
            toast.success("Información actualizada");
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="rname">Nombre</Label>
            <Input
              id="rname"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="raddress">Dirección</Label>
            <Input
              id="raddress"
              value={draft.address}
              onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="rphone">Teléfono</Label>
            <Input
              id="rphone"
              value={draft.phone}
              onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="rschedule">Horario</Label>
            <Input
              id="rschedule"
              value={draft.schedule}
              onChange={(e) => setDraft((d) => ({ ...d, schedule: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" className="rounded-xl">
              Guardar cambios
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <h3 className="text-sm font-bold">Estado del restaurante</h3>
        <ToggleRow
          id="open"
          label="Restaurante abierto"
          description="Cuando está cerrado, la app móvil deja de recibir pedidos nuevos."
          checked={settings.isOpen}
          onChange={(v) => {
            updateSettings({ isOpen: v });
            toast(v ? "Restaurante abierto" : "Restaurante cerrado", {
              description: v
                ? "Ya puedes recibir pedidos nuevos."
                : "Los clientes verán el local como cerrado.",
            });
          }}
        />
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <h3 className="text-sm font-bold">Preferencias</h3>
        <ToggleRow
          id="notify-new"
          label="Notificaciones de nuevos pedidos"
          description="Avisos en el panel cuando ingresa un pedido."
          checked={settings.notifyNewOrders}
          onChange={(v) => updateSettings({ notifyNewOrders: v })}
        />
        <ToggleRow
          id="notify-status"
          label="Notificaciones de cambios de estado"
          description="Avisos cuando un pedido avanza en el flujo."
          checked={settings.notifyStatusChanges}
          onChange={(v) => updateSettings({ notifyStatusChanges: v })}
        />
      </section>
    </div>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-border pt-4 first:mt-4">
      <div className="min-w-0">
        <Label htmlFor={id} className="font-semibold">
          {label}
        </Label>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
