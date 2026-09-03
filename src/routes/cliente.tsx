import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  ChefHat,
  Clock,
  Loader2,
  LogOut,
  MapPin,
  Minus,
  Plus,
  ShoppingCart,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatCLP } from "@/data/types";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/cliente")({
  component: ClienteApp,
});

type Restaurant = Tables<"restaurants">;
type Category = Tables<"categories">;
type Product = Tables<"products">;

/** Delivery fee fijo del MVP (mismo valor usado en los datos de ejemplo del panel de restaurante). */
const DELIVERY_FEE = 1500;

interface CartItem {
  product: Product;
  qty: number;
}

type Screen = "home" | "menu" | "cart" | "confirmation";

interface ConfirmedOrder {
  orderNumber: string;
  total: number;
  address: string;
  restaurantName: string;
}

function useRestaurants() {
  return useQuery({
    queryKey: ["restaurants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurants").select("*").order("name");
      if (error) throw error;
      return data as Restaurant[];
    },
  });
}

function useRestaurantMenu(restaurantId: string | null) {
  return useQuery({
    queryKey: ["restaurant-menu", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const [categoriesRes, productsRes] = await Promise.all([
        supabase.from("categories").select("*").eq("restaurant_id", restaurantId!).order("name"),
        supabase
          .from("products")
          .select("*")
          .eq("restaurant_id", restaurantId!)
          .eq("available", true)
          .order("name"),
      ]);
      if (categoriesRes.error) throw categoriesRes.error;
      if (productsRes.error) throw productsRes.error;
      return {
        categories: categoriesRes.data as Category[],
        products: productsRes.data as Product[],
      };
    },
  });
}

function ClienteHeader({ subtitle }: { subtitle?: string | undefined }) {
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
            {subtitle ?? `¡Hola ${profile?.name ?? "cliente"}!`}
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

function RestaurantList({ onSelect }: { onSelect: (r: Restaurant) => void }) {
  const { data: restaurants, isLoading, isError } = useRestaurants();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">Restaurantes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLoading
            ? "Cargando…"
            : `${restaurants?.length ?? 0} restaurante${restaurants?.length === 1 ? "" : "s"} disponible${restaurants?.length === 1 ? "" : "s"}`}
        </p>
      </div>

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <p className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No pudimos cargar los restaurantes. Intenta de nuevo más tarde.
        </p>
      )}

      {!isLoading && !isError && (restaurants?.length ?? 0) === 0 && (
        <p className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Todavía no hay restaurantes publicados.
        </p>
      )}

      {!isLoading && !isError && (restaurants?.length ?? 0) > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {restaurants!.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => onSelect(r)}
                className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-card transition-colors hover:border-primary/40"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Store className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{r.name}</span>
                  <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" />
                    {r.address}
                  </span>
                  {r.schedule && (
                    <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <Clock className="size-3.5 shrink-0" />
                      {r.schedule}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function QtyStepper({
  qty,
  onAdd,
  onRemove,
}: {
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  if (qty === 0) {
    return (
      <Button size="sm" className="rounded-lg" onClick={onAdd}>
        <Plus className="size-4" /> Agregar
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-background">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-lg"
        onClick={onRemove}
        aria-label="Quitar uno"
      >
        <Minus className="size-3.5" />
      </Button>
      <span className="min-w-4 text-center text-sm font-bold">{qty}</span>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-lg"
        onClick={onAdd}
        aria-label="Agregar uno"
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}

function RestaurantMenu({
  restaurant,
  cart,
  onBack,
  onAdd,
  onRemove,
  onViewCart,
}: {
  restaurant: Restaurant;
  cart: Record<string, CartItem>;
  onBack: () => void;
  onAdd: (product: Product) => void;
  onRemove: (productId: string) => void;
  onViewCart: () => void;
}) {
  const { data, isLoading, isError } = useRestaurantMenu(restaurant.id);
  const [categoryId, setCategoryId] = useState<string>("Todas");

  const products = useMemo(() => data?.products ?? [], [data]);
  const categories = useMemo(() => data?.categories ?? [], [data]);

  const visible = useMemo(() => {
    if (categoryId === "Todas") return products;
    if (categoryId === "Otros") return products.filter((p) => !p.category_id);
    return products.filter((p) => p.category_id === categoryId);
  }, [products, categoryId]);

  const hasUncategorized = products.some((p) => !p.category_id);

  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((acc, it) => acc + it.qty, 0);
  const cartSubtotal = cartItems.reduce((acc, it) => acc + it.qty * it.product.price, 0);

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-xl"
          onClick={onBack}
          aria-label="Volver a restaurantes"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-extrabold tracking-tight">{restaurant.name}</h1>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            {restaurant.address}
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <p className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No pudimos cargar el menú de este restaurante.
        </p>
      )}

      {!isLoading && !isError && (
        <>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {[
              { id: "Todas", name: "Todas" },
              ...categories,
              ...(hasUncategorized ? [{ id: "Otros", name: "Otros" }] : []),
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  categoryId === c.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              No hay productos disponibles en esta categoría por ahora.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((p) => {
                const qty = cart[p.id]?.qty ?? 0;
                return (
                  <li
                    key={p.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card"
                  >
                    <div
                      className="relative grid aspect-[16/9] place-items-center bg-primary-soft"
                      aria-hidden
                    >
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="size-full object-cover" />
                      ) : (
                        <>
                          <span className="text-4xl font-extrabold tracking-tight text-primary/40">
                            {p.emoji ?? p.name.slice(0, 2).toUpperCase()}
                          </span>
                          <UtensilsCrossed className="absolute right-3 bottom-3 size-5 text-primary/40" />
                        </>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="min-w-0 truncate font-bold">{p.name}</h3>
                        <span className="shrink-0 font-bold text-primary">
                          {formatCLP(p.price)}
                        </span>
                      </div>
                      {p.description && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {p.description}
                        </p>
                      )}
                      <div className="mt-auto flex justify-end pt-2">
                        <QtyStepper
                          qty={qty}
                          onAdd={() => onAdd(p)}
                          onRemove={() => onRemove(p.id)}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-4">
          <button
            onClick={onViewCart}
            className="flex w-full max-w-3xl items-center justify-between gap-3 rounded-2xl bg-primary px-4 py-3.5 text-primary-foreground shadow-soft"
          >
            <span className="flex items-center gap-2 text-sm font-bold">
              <ShoppingCart className="size-4" />
              {cartCount} artículo{cartCount === 1 ? "" : "s"}
            </span>
            <span className="text-sm font-bold">Ver carrito · {formatCLP(cartSubtotal)}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function CartView({
  restaurant,
  cart,
  address,
  note,
  onAddressChange,
  onNoteChange,
  onAdd,
  onRemove,
  onBack,
  onConfirm,
  isSubmitting,
}: {
  restaurant: Restaurant;
  cart: Record<string, CartItem>;
  address: string;
  note: string;
  onAddressChange: (v: string) => void;
  onNoteChange: (v: string) => void;
  onAdd: (product: Product) => void;
  onRemove: (productId: string) => void;
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}) {
  const items = Object.values(cart);
  const subtotal = items.reduce((acc, it) => acc + it.qty * it.product.price, 0);
  const total = subtotal + DELIVERY_FEE;
  const canConfirm = items.length > 0 && address.trim().length > 0 && !isSubmitting;

  return (
    <div className="flex flex-col gap-5 p-4 pb-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-xl"
          onClick={onBack}
          aria-label="Volver al menú"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold tracking-tight">Tu carrito</h1>
          <p className="truncate text-xs text-muted-foreground">{restaurant.name}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Tu carrito está vacío.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map(({ product, qty }) => (
            <li
              key={product.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-lg font-bold text-primary/70">
                {product.emoji ?? product.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{product.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {formatCLP(product.price)} c/u
                </span>
              </span>
              <QtyStepper
                qty={qty}
                onAdd={() => onAdd(product)}
                onRemove={() => onRemove(product.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="direccion">Dirección de entrega</Label>
        <Input
          id="direccion"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="Calle, número, comuna"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="nota">Nota para el restaurante (opcional)</Label>
        <Textarea
          id="nota"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Ej: sin cebolla, tocar el timbre, etc."
          rows={3}
        />
      </div>

      <div className="flex flex-col gap-1.5 rounded-2xl border border-border bg-card p-4 text-sm shadow-card">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{formatCLP(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Despacho</span>
          <span>{formatCLP(DELIVERY_FEE)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-border pt-2 text-base font-bold">
          <span>Total</span>
          <span className="text-primary">{formatCLP(total)}</span>
        </div>
      </div>

      <Button className="rounded-xl" size="lg" disabled={!canConfirm} onClick={onConfirm}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Confirmando…
          </>
        ) : (
          "Confirmar pedido (pago simulado)"
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Este MVP no procesa pagos reales: al confirmar, el pedido queda registrado como pagado y
        pasa directo a la cocina.
      </p>
    </div>
  );
}

function ConfirmationView({ order, onDone }: { order: ConfirmedOrder; onDone: () => void }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-success-soft text-success">
        <CheckCircle2 className="size-7" />
      </span>
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">¡Pedido confirmado!</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {order.restaurantName} ya recibió tu pedido y lo está preparando.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-1.5 rounded-2xl border border-border bg-card p-4 text-sm shadow-card">
        <div className="flex justify-between">
          <span className="text-muted-foreground">N° de pedido</span>
          <span className="font-bold">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="font-bold text-primary">{formatCLP(order.total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Estado</span>
          <span className="font-bold">Recibido</span>
        </div>
      </div>
      <Button className="rounded-xl" onClick={onDone}>
        Volver al inicio
      </Button>
    </div>
  );
}

function ClienteApp() {
  const { profile } = useAuth();
  const [screen, setScreen] = useState<Screen>("home");
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("No hay perfil de cliente vinculado.");
      if (!selected) throw new Error("No hay restaurante seleccionado.");

      const items = Object.values(cart);
      if (items.length === 0) throw new Error("El carrito está vacío.");

      const subtotal = items.reduce((acc, it) => acc + it.qty * it.product.price, 0);
      const total = subtotal + DELIVERY_FEE;
      const orderNumber = `FP-${Date.now().toString(36).toUpperCase().slice(-6)}`;

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: profile.id,
          restaurant_id: selected.id,
          address,
          status: "recibido",
          delivery_fee: DELIVERY_FEE,
          subtotal,
          total,
          note: note.trim() ? note.trim() : null,
        })
        .select()
        .single();
      if (orderError) throw orderError;

      const { error: itemsError } = await supabase.from("order_items").insert(
        items.map((it) => ({
          order_id: order.id,
          product_id: it.product.id,
          quantity: it.qty,
          unit_price: it.product.price,
        })),
      );
      if (itemsError) throw itemsError;

      const { error: historyError } = await supabase
        .from("order_status_history")
        .insert({ order_id: order.id, status: "recibido" });
      if (historyError) throw historyError;

      return { orderNumber, total, address, restaurantName: selected.name } as ConfirmedOrder;
    },
    onSuccess: (result) => {
      setConfirmedOrder(result);
      setCart({});
      setAddress("");
      setNote("");
      setScreen("confirmation");
    },
    onError: (err) => {
      console.error("[cliente] error creando pedido", err);
      toast.error("No pudimos confirmar tu pedido", {
        description: err instanceof Error ? err.message : "Intenta de nuevo en unos segundos.",
      });
    },
  });

  const handleSelectRestaurant = (r: Restaurant) => {
    if (selected && selected.id !== r.id && Object.keys(cart).length > 0) {
      setCart({});
      toast.info("Vaciamos tu carrito anterior porque cambiaste de restaurante.");
    }
    setSelected(r);
    setScreen("menu");
  };

  const handleAdd = (product: Product) => {
    setCart((prev) => {
      const existing = prev[product.id];
      return {
        ...prev,
        [product.id]: { product, qty: (existing?.qty ?? 0) + 1 },
      };
    });
  };

  const handleRemove = (productId: string) => {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      if (existing.qty <= 1) {
        const { [productId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: { ...existing, qty: existing.qty - 1 } };
    });
  };

  const headerSubtitle =
    screen === "confirmation"
      ? "Pedido confirmado"
      : screen === "cart"
        ? "Tu carrito"
        : selected
          ? selected.name
          : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ClienteHeader subtitle={headerSubtitle} />
      <main className="mx-auto w-full max-w-3xl flex-1">
        {screen === "home" && <RestaurantList onSelect={handleSelectRestaurant} />}

        {screen === "menu" && selected && (
          <RestaurantMenu
            restaurant={selected}
            cart={cart}
            onBack={() => setScreen("home")}
            onAdd={handleAdd}
            onRemove={handleRemove}
            onViewCart={() => setScreen("cart")}
          />
        )}

        {screen === "cart" && selected && (
          <CartView
            restaurant={selected}
            cart={cart}
            address={address}
            note={note}
            onAddressChange={setAddress}
            onNoteChange={setNote}
            onAdd={handleAdd}
            onRemove={handleRemove}
            onBack={() => setScreen("menu")}
            onConfirm={() => placeOrder.mutate()}
            isSubmitting={placeOrder.isPending}
          />
        )}

        {screen === "confirmation" && confirmedOrder && (
          <ConfirmationView
            order={confirmedOrder}
            onDone={() => {
              setSelected(null);
              setConfirmedOrder(null);
              setScreen("home");
            }}
          />
        )}
      </main>
    </div>
  );
}
