import { z } from "zod"

export const loginSchema = z.object({
  // Un email n'est pas sensible à la casse en pratique — seul le mot de passe doit être saisi
  // exactement. On normalise ici pour que la connexion fonctionne quelle que soit la casse tapée.
  email: z.string().email("Email invalide").transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1, "Mot de passe requis"),
})

export type LoginInput = z.infer<typeof loginSchema>
