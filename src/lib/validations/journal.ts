import { z } from "zod"
import { decimalField, integerField } from "./shared"

export const journalEntrySchema = z.object({
  workoutId: z.string().optional().or(z.literal("")),
  rpe: integerField,
  fatigue: integerField,
  sleepQuality: integerField,
  sleepHours: decimalField,
  stress: integerField,
  comment: z.string().max(2000).optional().or(z.literal("")),
})

export type JournalEntryInput = z.infer<typeof journalEntrySchema>
