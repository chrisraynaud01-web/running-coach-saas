"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentCoach } from "@/lib/current-coach"
import { workoutSchema, type WorkoutBlockInput, type WorkoutInput } from "@/lib/validations/workout"
import { toOptionalFloat, toOptionalInt } from "@/lib/validations/shared"
import { paceFromVmaPercent } from "@/lib/time"

async function getAthleteVma(athleteId: string) {
  const metrics = await prisma.athleteMetrics.findFirst({
    where: { athleteId },
    orderBy: { recordedAt: "desc" },
    select: { vma: true },
  })
  return metrics?.vma ?? undefined
}

function buildBlocksCreateData(blocks: WorkoutBlockInput[], athleteVma?: number) {
  return blocks.map((b, index) => {
    const vmaPercent = toOptionalInt(b.vmaPercent) ?? null
    const paceTargetSecPerKm = vmaPercent
      ? paceFromVmaPercent(athleteVma, vmaPercent) ?? null
      : null

    return {
      type: b.type,
      order: index,
      label: b.label || null,
      repetitions: toOptionalInt(b.repetitions) ?? null,
      distanceMeters: toOptionalInt(b.distanceMeters) ?? null,
      durationSeconds: toOptionalInt(b.durationSeconds) ?? null,
      recoveryDurationSeconds: toOptionalInt(b.recoveryDurationSeconds) ?? null,
      vmaPercent,
      paceTargetSecPerKm,
      intensity: b.intensity,
    }
  })
}

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

  const blocks = data.blocks ?? []
  const plannedDistanceKm = toOptionalFloat(data.plannedDistanceKm)
  const plannedDurationMin = toOptionalInt(data.plannedDurationMin)
  const athleteVma = await getAthleteVma(data.athleteId)

  await prisma.workout.create({
    data: {
      athleteId: data.athleteId,
      createdByCoachId: coach.id,
      title: data.title,
      type: data.type,
      scheduledDate: new Date(data.scheduledDate),
      plannedDistanceMeters: plannedDistanceKm ? Math.round(plannedDistanceKm * 1000) : null,
      plannedDurationSeconds: plannedDurationMin ? plannedDurationMin * 60 : null,
      coachNotes: data.coachNotes || null,
      blocks:
        blocks.length > 0
          ? { create: buildBlocksCreateData(blocks, athleteVma) }
          : undefined,
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

  const blocks = data.blocks ?? []
  const plannedDistanceKm = toOptionalFloat(data.plannedDistanceKm)
  const plannedDurationMin = toOptionalInt(data.plannedDurationMin)
  const athleteVma = await getAthleteVma(data.athleteId)

  await prisma.$transaction([
    prisma.workoutBlock.deleteMany({ where: { workoutId } }),
    prisma.workout.update({
      where: { id: workoutId },
      data: {
        title: data.title,
        type: data.type,
        scheduledDate: new Date(data.scheduledDate),
        plannedDistanceMeters: plannedDistanceKm ? Math.round(plannedDistanceKm * 1000) : null,
        plannedDurationSeconds: plannedDurationMin ? plannedDurationMin * 60 : null,
        coachNotes: data.coachNotes || null,
        blocks:
          blocks.length > 0
            ? { create: buildBlocksCreateData(blocks, athleteVma) }
            : undefined,
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
