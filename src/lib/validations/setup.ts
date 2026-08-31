import { z } from "zod"

export const setupSchema = z.object({
  name: z.string().min(1, "Nom requis").max(100),
  email: z.string().email("Email invalide").transform((v) => v.trim().toLowerCase()),
  password: z.string().min(8, "8 caractères minimum"),
})

export type SetupInput = z.infer<typeof setupSchema>
