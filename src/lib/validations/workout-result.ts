import { z } from "zod"
import { clockField, integerField } from "./shared"

export const blockResultSchema = z.object({
  blockId: z.string().min(1),
  actualDuration: clockField,
  actualReps: z.array(clockField).optional(),
  actualNotes: z.string().max(500).optional().or(z.literal("")),
})

export const workoutResultSchema = z.object({
  workoutId: z.string().min(1),
  blocks: z.array(blockResultSchema),
  // Ressenti de difficulté (1-10) pour la séance entière — pertinent aussi bien pour une
  // séance de course à pied que pour une séance de musculation sans structure détaillée.
  rpe: integerField,
})

export type WorkoutResultInput = z.infer<typeof workoutResultSchema>
