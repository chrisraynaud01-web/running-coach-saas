import { z } from "zod"
import { decimalField, integerField } from "./shared"

const clockField = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || /^\d{1,2}(:\d{1,2}){1,2}$/.test(v), "Format attendu : mm:ss ou h:mm:ss")

export const athleteMetricsSchema = z.object({
  vma: decimalField,
  maxHeartRate: integerField,
  restingHeartRate: integerField,
  weightKg: decimalField,
  time5k: clockField,
  time10k: clockField,
  timeHalfMarathon: clockField,
  timeMarathon: clockField,
})

export type AthleteMetricsInput = z.infer<typeof athleteMetricsSchema>
