import { z } from "zod"
import { decimalField, integerField, clockField } from "./shared"

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
