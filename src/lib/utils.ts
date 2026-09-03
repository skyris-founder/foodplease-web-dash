import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extrae un mensaje legible de un error, sea un `Error` nativo o un error de
 * Supabase (PostgrestError/AuthError), que trae `.message` pero no extiende
 * `Error` — así que `err instanceof Error` por sí solo lo deja pasar en blanco.
 */
export function getErrorMessage(err: unknown, fallback = "Intenta de nuevo."): string {
  if (err instanceof Error) return err.message;
  if (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    return (err as { message: string }).message;
  }
  return fallback;
}
