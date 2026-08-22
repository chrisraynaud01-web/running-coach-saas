"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentCoach } from "@/lib/current-coach"
import { workoutSchema, type WorkoutInput } from "@/lib/validations/workout"
import { combineDateAndTimeOfDay } from "@/lib/time"
import { getAthleteVma, buildBlocksCreateData, computeWorkoutTotals } from "@/lib/workout-build"

export async function createWorkout(input: WorkoutInput) {
  const parsed = workoutSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  const coach = await getCurrentCoach()
  const data = parsed.data

  const athlete = await prisma.athlete.findUnique({
    where: { id: data.athleteId, coachId: coach.id },
  })
  if (!athlete) {
    return { success: false as const, error: "Athlète introuvable" }
  }

  const athleteVma = await getAthleteVma(data.athleteId)
  const blocksData = buildBlocksCreateData(data.blocks ?? [], athleteVma)
  const totals = computeWorkoutTotals(blocksData)

  await prisma.workout.create({
    data: {
      athleteId: data.athleteId,
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

  revalidatePath(`/athletes/${data.athleteId}`)
  return { success: true as const }
}

export async function updateWorkout(workoutId: string, input: WorkoutInput) {
  const parsed = workoutSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  const coach = await getCurrentCoach()
  const data = parsed.data

  const workout = await prisma.workout.findUnique({
    where: { id: workoutId, createdByCoachId: coach.id },
  })
  if (!workout || workout.athleteId !== data.athleteId) {
    return { success: false as const, error: "Séance introuvable" }
  }

  const athleteVma = await getAthleteVma(data.athleteId)
  const blocksData = buildBlocksCreateData(data.blocks ?? [], athleteVma)
  const totals = computeWorkoutTotals(blocksData)

  await prisma.$transaction([
    prisma.workoutBlock.deleteMany({ where: { workoutId } }),
    prisma.workout.update({
      where: { id: workoutId },
      data: {
        title: data.title,
        type: data.type,
        scheduledDate: combineDateAndTimeOfDay(data.scheduledDate, data.timeOfDay),
        plannedDistanceMeters: totals.plannedDistanceMeters,
        plannedDurationSeconds: totals.plannedDurationSeconds,
        coachNotes: data.coachNotes || null,
        blocks: blocksData.length > 0 ? { create: blocksData } : undefined,
      },
    }),
  ])

  revalidatePath(`/athletes/${data.athleteId}`)
  return { success: true as const }
}

export async function deleteWorkout(workoutId: string, athleteId: string) {
  const coach = await getCurrentCoach()

  await prisma.workout.deleteMany({
    where: { id: workoutId, createdByCoachId: coach.id },
  })

  revalidatePath(`/athletes/${athleteId}`)
  return { success: true as const }
}

export async function markWorkoutCompleted(workoutId: string, athleteId: string) {
  const coach = await getCurrentCoach()

  await prisma.workout.updateMany({
    where: { id: workoutId, createdByCoachId: coach.id },
    data: { status: "COMPLETED", completedAt: new Date() },
  })

  revalidatePath(`/athletes/${athleteId}`)
  return { success: true as const }
}
