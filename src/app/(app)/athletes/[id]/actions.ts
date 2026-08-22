"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentCoach } from "@/lib/current-coach"
import { workoutSchema, type WorkoutBlockInput, type WorkoutInput } from "@/lib/validations/workout"
import { toOptionalInt } from "@/lib/validations/shared"
import {
  paceFromVmaPercent,
  durationFromPaceAndDistance,
  combineDateAndTimeOfDay,
  parseClockToSeconds,
} from "@/lib/time"

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
    // L'allure vient soit du % VMA (calculée à partir de la VMA de l'athlète), soit d'une
    // saisie directe du coach (ex : "3'55/km") quand la VMA n'est pas connue ou pas pertinente.
    const paceFromVma = vmaPercent ? paceFromVmaPercent(athleteVma, vmaPercent) : undefined
    const paceManual = parseClockToSeconds(b.paceManual)
    const paceTargetSecPerKm = paceFromVma ?? paceManual ?? null
    const distanceMeters = toOptionalInt(b.distanceMeters) ?? null
    // La durée (par répétition) est déduite de l'allure x distance quand c'est possible,
    // sinon on garde la saisie manuelle du coach (ex : bloc d'échauffement en minutes).
    const autoDurationSeconds =
      paceTargetSecPerKm && distanceMeters ? durationFromPaceAndDistance(paceTargetSecPerKm, distanceMeters) : null
    const durationSeconds = autoDurationSeconds ?? toOptionalInt(b.durationSeconds) ?? null

    return {
      type: b.type,
      order: index,
      label: b.label || null,
      sets: toOptionalInt(b.sets) ?? null,
      repetitions: toOptionalInt(b.repetitions) ?? null,
      distanceMeters,
      durationSeconds,
      vmaPercent,
      paceTargetSecPerKm,
      recoveryDurationSeconds: parseClockToSeconds(b.recoveryDuration) ?? null,
      recoveryBetweenSetsSeconds: parseClockToSeconds(b.recoveryBetweenSets) ?? null,
      intensity: b.intensity,
    }
  })
}

function computeWorkoutTotals(blocks: ReturnType<typeof buildBlocksCreateData>) {
  let totalDistance = 0
  let totalDuration = 0
  for (const b of blocks) {
    const reps = b.repetitions ?? 1
    const sets = b.sets ?? 1
    const totalReps = reps * sets
    if (b.distanceMeters) totalDistance += b.distanceMeters * totalReps
    if (b.durationSeconds) totalDuration += b.durationSeconds * totalReps
    if (b.recoveryDurationSeconds) totalDuration += b.recoveryDurationSeconds * (reps - 1) * sets
    if (b.recoveryBetweenSetsSeconds) totalDuration += b.recoveryBetweenSetsSeconds * (sets - 1)
  }
  return {
    plannedDistanceMeters: totalDistance || null,
    plannedDurationSeconds: totalDuration || null,
  }
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
