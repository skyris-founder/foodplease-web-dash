import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Bike,
  ChefHat,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings as SettingsIcon,
  UtensilsCrossed,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/store/auth";
import { useFoodPlease } from "@/store/foodplease";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/menu", label: "Menú", icon: UtensilsCrossed },
  { to: "/repartidores", label: "Repartidores", icon: Bike },
  { to: "/historial", label: "Historial", icon: History },
  { to: "/configuracion", label: "Configuración", icon: SettingsIcon },
] as const;

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
        <ChefHat className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-base leading-tight font-extrabold tracking-tight">
          Food<span className="text-primary">Please</span>
        </span>
        <span className="block text-[11px] font-medium text-muted-foreground">
          Panel de restaurante
        </span>
      </span>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/" }}
          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
        >
          <Icon className="size-[18px] shrink-0" />
          <span className="truncate">{label}</span>
        </Link>
      ))}
    </nav>
  );
}

function SidebarFooter() {
  const { settings } = useFoodPlease();
  const { signOut } = useAuth();
  return (
    <div className="rounded-2xl border border-sidebar-border bg-muted/50 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-accent-foreground">
          CR
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{settings.name}</p>
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span
              className={cn(
                "size-1.5 rounded-full",
                settings.isOpen ? "bg-success" : "bg-muted-foreground",
              )}
            />
            {settings.isOpen ? "Abierto" : "Cerrado"}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        onClick={() => signOut()}
      >
        <LogOut className="size-4" /> Cerrar sesión
      </Button>
    </div>
  );
}

function useSectionTitle() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const match = NAV.find((n) => (n.to === "/" ? pathname === "/" : pathname.startsWith(n.to)));
  return match?.label ?? "Dashboard";
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const title = useSectionTitle();
  const { settings, orders } = useFoodPlease();
  const newOrders = orders.filter((o) => o.status === "recibido").length;

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col justify-between border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <div className="flex flex-col gap-6">
          <Logo />
          <NavLinks />
        </div>
        <SidebarFooter />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menú">
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-4">
                  <SheetTitle className="sr-only">Navegación</SheetTitle>
                  <div className="flex h-full flex-col justify-between gap-6">
                    <div className="flex flex-col gap-6">
                      <Logo />
                      <NavLinks onNavigate={() => setMobileOpen(false)} />
                    </div>
                    <SidebarFooter />
                  </div>
                </SheetContent>
              </Sheet>
              <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">{title}</h1>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="relative hidden md:block">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar pedido o cliente"
                  aria-label="Buscar"
                  className="w-56 rounded-xl pl-9 lg:w-72"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Notificaciones (${newOrders} nuevas)`}
                className="relative"
                onClick={() =>
                  toast(`${newOrders} pedidos nuevos por confirmar`, {
                    description: "Revisa la sección Pedidos para gestionarlos.",
                  })
                }
              >
                <Bell className="size-5" />
                {newOrders > 0 && (
                  <span className="absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {newOrders}
                  </span>
                )}
              </Button>
              <div className="flex items-center gap-2 border-l border-border pl-2 sm:pl-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-accent-foreground">
                  CR
                </span>
                <span className="hidden max-w-[9rem] truncate text-sm font-semibold xl:block">
                  {settings.name}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:pb-10">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-background/95 backdrop-blur sm:hidden">
        {NAV.slice(0, 4).map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground data-[status=active]:text-primary"
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
