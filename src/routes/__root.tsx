import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "@/components/foodplease/AppShell";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/store/auth";
import { FoodPleaseProvider } from "@/store/foodplease";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FoodPlease | Panel web para restaurantes" },
      {
        name: "description",
        content:
          "Panel web MVP de FoodPlease para gestionar pedidos, repartidores y menú del restaurante.",
      },
      { property: "og:title", content: "FoodPlease | Panel web para restaurantes" },
      {
        property: "og:description",
        content: "Coordina pedidos, estados y entregas desde una sola interfaz.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/**
 * `pathname.startsWith(base)` por sí solo confunde "/repartidor" (la app del
 * repartidor) con "/repartidores" (la página del dashboard de restaurante) —
 * esta función exige que lo que sigue sea el final de la ruta o un "/".
 */
function isUnderPath(pathname: string, base: string) {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/**
 * Enruta según el rol del usuario autenticado:
 * - sin sesión           -> /login
 * - role "restaurante"   -> AppShell + dashboard actual (sin cambios)
 * - role "cliente"       -> /cliente
 * - role "repartidor"    -> /repartidor
 * - sesión sin perfil    -> pantalla de aviso (perfil no vinculado)
 */
function AppRouting() {
  const { session, role, loading, error, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    const isLoginRoute = pathname === "/login";

    if (!session) {
      if (!isLoginRoute) navigate({ to: "/login" });
      return;
    }

    if (isLoginRoute) {
      navigate({ to: "/" });
      return;
    }

    if (!role) return;

    if (role === "cliente" && !isUnderPath(pathname, "/cliente")) {
      navigate({ to: "/cliente" });
    } else if (role === "repartidor" && !isUnderPath(pathname, "/repartidor")) {
      navigate({ to: "/repartidor" });
    } else if (
      role === "restaurante" &&
      (isUnderPath(pathname, "/cliente") || isUnderPath(pathname, "/repartidor"))
    ) {
      navigate({ to: "/" });
    }
  }, [loading, session, role, pathname, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  if (pathname === "/login") {
    return <Outlet />;
  }

  if (!session) {
    return null;
  }

  if (!role) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <h1 className="text-lg font-bold">Cuenta sin perfil asociado</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {error ??
            "Tu usuario inició sesión pero no tiene un perfil de FoodPlease vinculado todavía."}
        </p>
        <Button variant="outline" className="rounded-xl" onClick={() => signOut()}>
          Cerrar sesión
        </Button>
      </div>
    );
  }

  // El rol ya se conoce pero la URL todavía no coincide con su experiencia
  // (el redirect de arriba está en camino): evita pintar la vista equivocada
  // durante ese instante.
  const isOnOwnRoute =
    (role === "cliente" && isUnderPath(pathname, "/cliente")) ||
    (role === "repartidor" && isUnderPath(pathname, "/repartidor")) ||
    (role === "restaurante" &&
      !isUnderPath(pathname, "/cliente") &&
      !isUnderPath(pathname, "/repartidor"));

  if (!isOnOwnRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  if (role === "restaurante") {
    return (
      <AppShell>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </AppShell>
    );
  }

  return <Outlet />;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FoodPleaseProvider>
          <AppRouting />
          <Toaster position="top-right" richColors />
        </FoodPleaseProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
