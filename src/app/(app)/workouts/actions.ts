"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentCoach } from "@/lib/current-coach"
import { bulkWorkoutSchema, type BulkWorkoutInput } from "@/lib/validations/workout"
import { combineDateAndTimeOfDay } from "@/lib/time"
import { getAthleteVma, buildBlocksCreateData, computeWorkoutTotals } from "@/lib/workout-build"

export async function createWorkoutForAthletes(input: BulkWorkoutInput) {
  const parsed = bulkWorkoutSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  const coach = await getCurrentCoach()
  const data = parsed.data

  const athletes = await prisma.athlete.findMany({
    where: { id: { in: data.athleteIds }, coachId: coach.id },
    select: { id: true },
  })
  if (athletes.length !== data.athleteIds.length) {
    return { success: false as const, error: "Un ou plusieurs athlètes sont introuvables" }
  }

  await Promise.all(
    athletes.map(async (athlete) => {
      const athleteVma = await getAthleteVma(athlete.id)
      const blocksData = buildBlocksCreateData(data.blocks ?? [], athleteVma)
      const totals = computeWorkoutTotals(blocksData)

      await prisma.workout.create({
        data: {
          athleteId: athlete.id,
          createdByCoachId: coach.id,
          title: data.title,
          type: data.type,
          scheduledDate: combineDateAndTimeOfDay(data.scheduledDate, data.timeOfDay),
          plannedDistanceMeters: totals.plannedDistanceMeters,
          plannedDurationSeconds: totals.plannedDurationSeconds,
          coachNotes: data.coachNotes || null,
          blocks: blocksData.length > 0 ? { create: blocksData } : undefined,
        },
      })
    })
  )

  revalidatePath("/workouts")
  revalidatePath("/dashboard")
  revalidatePath("/calendar")
  for (const athlete of athletes) {
    revalidatePath(`/athletes/${athlete.id}`)
  }

  return { success: true as const, count: athletes.length }
}
