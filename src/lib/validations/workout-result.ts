import { z } from "zod"
import { clockField } from "./shared"

export const blockResultSchema = z.object({
  blockId: z.string().min(1),
  actualDuration: clockField,
  actualNotes: z.string().max(500).optional().or(z.literal("")),
})

export const workoutResultSchema = z.object({
  workoutId: z.string().min(1),
  blocks: z.array(blockResultSchema),
})

export type WorkoutResultInput = z.infer<typeof workoutResultSchema>
