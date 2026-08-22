import { z } from "zod"
import { decimalField } from "./shared"

export const athleteSchema = z.object({
  firstName: z.string().min(1, "Prénom requis").max(100),
  lastName: z.string().min(1, "Nom requis").max(100),
  email: z.string().email("Email invalide"),
  phone: z.string().max(30).optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  sex: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  heightCm: decimalField,
  weightKg: decimalField,
})

export type AthleteInput = z.infer<typeof athleteSchema>
