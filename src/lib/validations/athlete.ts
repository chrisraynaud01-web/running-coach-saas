import { z } from "zod"
import { decimalField, integerField, clockField } from "./shared"

export const athleteSchema = z.object({
  firstName: z.string().min(1, "Prénom requis").max(100),
  lastName: z.string().min(1, "Nom requis").max(100),
  email: z.string().email("Email invalide").transform((v) => v.trim().toLowerCase()),
  phone: z.string().max(30).optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  sex: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  heightCm: decimalField,
  // Données sportives — renseignées uniquement à la création (voir AthleteFormDialog).
  vma: decimalField,
  maxHeartRate: integerField,
  restingHeartRate: integerField,
  weightKg: decimalField,
  time5k: clockField,
  time10k: clockField,
  timeHalfMarathon: clockField,
  timeMarathon: clockField,
})

export type AthleteInput = z.infer<typeof athleteSchema>
