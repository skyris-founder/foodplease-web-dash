import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, UtensilsCrossed } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES } from "@/data/mock";
import { formatCLP, type Product } from "@/data/types";
import { cn } from "@/lib/utils";
import { useFoodPlease } from "@/store/foodplease";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menú del restaurante | FoodPlease" },
      {
        name: "description",
        content:
          "Administra categorías, productos, precios y disponibilidad del menú publicado en la app FoodPlease.",
      },
      { property: "og:title", content: "Menú del restaurante | FoodPlease" },
      {
        property: "og:description",
        content: "Activa o desactiva productos y mantén el menú siempre actualizado.",
      },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const { products, toggleProduct, addProduct, updateProduct } = useFoodPlease();
  const [category, setCategory] = useState<string>("Todas");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const visible = category === "Todas" ? products : products.filter((p) => p.category === category);

  return (
    <div className="flex flex-col gap-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold tracking-tight">Menú</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {products.filter((p) => p.available).length} de {products.length} productos disponibles
          </p>
        </div>
        <Button className="shrink-0 rounded-xl" onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Agregar producto
        </Button>
      </header>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {["Todas", ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              category === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Aún no hay productos en esta categoría.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => (
            <li
              key={p.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card"
            >
              <div
                className={cn(
                  "relative grid aspect-[16/9] place-items-center bg-primary-soft",
                  !p.available && "opacity-50 grayscale",
                )}
                aria-hidden
              >
                <span className="text-4xl font-extrabold tracking-tight text-primary/40">
                  {p.emoji || p.name.slice(0, 2).toUpperCase()}
                </span>
                <UtensilsCrossed className="absolute right-3 bottom-3 size-5 text-primary/40" />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 truncate font-bold">{p.name}</h3>
                  <span className="shrink-0 font-bold text-primary">{formatCLP(p.price)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{p.description}</p>
                <span className="w-fit rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  {p.category}
                </span>
                <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={p.available}
                      onCheckedChange={() => toggleProduct(p.id)}
                      aria-label={`Disponibilidad de ${p.name}`}
                    />
                    <span className={p.available ? "text-success" : "text-muted-foreground"}>
                      {p.available ? "Disponible" : "No disponible"}
                    </span>
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => setEditing(p)}
                  >
                    <Pencil className="size-4" /> Editar
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ProductDialog
        open={creating}
        onOpenChange={setCreating}
        title="Agregar producto"
        description="Los cambios son locales al MVP y no se envían a un backend."
        onSubmit={(data) => addProduct({ ...data, available: true })}
      />
      <ProductDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Editar producto"
        description="Actualiza la información visible para los clientes."
        {...(editing ? { product: editing } : {})}
        onSubmit={(data) => {
          if (editing) updateProduct(editing.id, data);
          setEditing(null);
        }}
      />
    </div>
  );
}

interface FormData {
  name: string;
  description: string;
  price: number;
  category: string;
}

function ProductDialog({
  open,
  onOpenChange,
  title,
  description,
  product,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: string;
  product?: Product;
  onSubmit: (data: FormData) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          id="product-form"
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            onSubmit({
              name: String(fd.get("name") ?? ""),
              description: String(fd.get("description") ?? ""),
              price: Number(fd.get("price") ?? 0),
              category: String(fd.get("category") ?? CATEGORIES[0]),
            });
            onOpenChange(false);
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required defaultValue={product?.name ?? ""} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              required
              defaultValue={product?.description ?? ""}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="price">Precio (CLP)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min={0}
                required
                defaultValue={product?.price ?? 0}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="category">Categoría</Label>
              <select
                id="category"
                name="category"
                defaultValue={product?.category ?? CATEGORIES[0]}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
