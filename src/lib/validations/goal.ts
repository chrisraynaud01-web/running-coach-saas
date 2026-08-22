import { z } from "zod"

export const goalTypeValues = ["RACE", "PERFORMANCE", "HEALTH", "OTHER"] as const

export const goalTypeLabels: Record<(typeof goalTypeValues)[number], string> = {
  RACE: "Course",
  PERFORMANCE: "Performance",
  HEALTH: "Santé",
  OTHER: "Autre",
}

export const goalStatusValues = ["ACTIVE", "ACHIEVED", "ABANDONED"] as const

export const goalStatusLabels: Record<(typeof goalStatusValues)[number], string> = {
  ACTIVE: "En cours",
  ACHIEVED: "Atteint",
  ABANDONED: "Abandonné",
}

export const goalSchema = z.object({
  title: z.string().min(1, "Titre requis").max(200),
  type: z.enum(goalTypeValues),
  targetDate: z.string().optional().or(z.literal("")),
  targetValue: z.string().max(200).optional().or(z.literal("")),
  isPrimary: z.boolean(),
  status: z.enum(goalStatusValues),
})

export type GoalInput = z.infer<typeof goalSchema>
