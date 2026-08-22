import { prisma } from "@/lib/prisma"
import { toOptionalInt } from "@/lib/validations/shared"
import { paceFromVmaPercent, durationFromPaceAndDistance, parseClockToSeconds } from "@/lib/time"
import type { WorkoutBlockInput } from "@/lib/validations/workout"

export async function getAthleteVma(athleteId: string) {
  const metrics = await prisma.athleteMetrics.findFirst({
    where: { athleteId },
    orderBy: { recordedAt: "desc" },
    select: { vma: true },
  })
  return metrics?.vma ?? undefined
}

export function buildBlocksCreateData(blocks: WorkoutBlockInput[], athleteVma?: number) {
  return blocks.map((b, index) => {
    const vmaPercent = toOptionalInt(b.vmaPercent) ?? null
    // L'allure vient soit du % VMA (calculée à partir de la VMA de l'athlète), soit d'une
    // saisie directe du coach (ex : "3'55/km") quand la VMA n'est pas connue ou pas pertinente.
    const paceFromVma = vmaPercent ? paceFromVmaPercent(athleteVma, vmaPercent) : undefined
    const paceManual = parseClockToSeconds(b.paceManual)
    const paceTargetSecPerKm = paceFromVma ?? paceManual ?? null
    const distanceMeters = toOptionalInt(b.distanceMeters) ?? null
    // La durée (par répétition) est déduite de l'allure x distance quand c'est possible,
    // sinon on garde la saisie manuelle du coach (ex : bloc d'échauffement de 20 minutes).
    const autoDurationSeconds =
      paceTargetSecPerKm && distanceMeters ? durationFromPaceAndDistance(paceTargetSecPerKm, distanceMeters) : null
    const durationSeconds = autoDurationSeconds ?? parseClockToSeconds(b.durationManual) ?? null

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

export function computeWorkoutTotals(blocks: ReturnType<typeof buildBlocksCreateData>) {
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
