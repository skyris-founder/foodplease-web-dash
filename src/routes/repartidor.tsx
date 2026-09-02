import { createFileRoute } from "@tanstack/react-router";
import { Bike } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/auth";

export const Route = createFileRoute("/repartidor")({
  component: RepartidorPlaceholder,
});

function RepartidorPlaceholder() {
  const { profile, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
        <Bike className="size-6" />
      </span>
      <div>
        <h1 className="text-xl font-bold">Hola, {profile?.name ?? "repartidor"}</h1>
        <p className="text-sm text-muted-foreground">
          Sesión de repartidor reconocida correctamente. La experiencia de entregas se construye en
          el siguiente paso.
        </p>
      </div>
      <Button variant="outline" className="rounded-xl" onClick={() => signOut()}>
        Cerrar sesión
      </Button>
    </div>
  );
}
