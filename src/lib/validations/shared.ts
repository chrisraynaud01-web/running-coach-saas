import { z } from "zod"

// Les inputs HTML renvoient des chaînes de caractères. On valide le format en
// string côté formulaire (évite les soucis de typage de z.coerce/z.preprocess
// avec react-hook-form) et on convertit en nombre côté serveur au moment de
// l'écriture en base.
export const integerField = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || /^\d+$/.test(v), "Doit être un nombre entier")

export const decimalField = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || /^\d+(\.\d+)?$/.test(v), "Doit être un nombre")

export const clockField = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || /^\d{1,2}(:\d{1,2}){1,2}$/.test(v), "Format attendu : mm:ss ou h:mm:ss")

export function toOptionalInt(value?: string) {
  return value ? parseInt(value, 10) : undefined
}

export function toOptionalFloat(value?: string) {
  return value ? parseFloat(value) : undefined
}
