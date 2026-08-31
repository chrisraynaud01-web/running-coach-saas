import { prisma } from "@/lib/prisma"
import { toOptionalInt } from "@/lib/validations/shared"
import { paceFromVmaPercent, durationFromPaceAndDistance, parseClockToSeconds } from "@/lib/time"
import type { WorkoutBlockInput, WorkoutBlockLegInput } from "@/lib/validations/workout"

export async function getAthleteVma(athleteId: string) {
  const metrics = await prisma.athleteMetrics.findFirst({
    where: { athleteId },
    orderBy: { recordedAt: "desc" },
    select: { vma: true },
  })
  return metrics?.vma ?? undefined
}

// Allure (depuis %VMA ou saisie directe) puis durée (depuis allure x distance, ou saisie
// directe) — logique partagée entre un bloc simple et chaque portion d'un bloc enchaîné.
function computePaceAndDuration(
  vmaPercentRaw: string | undefined,
  paceManual: string | undefined,
  distanceMetersRaw: string | undefined,
  durationManual: string | undefined,
  athleteVma?: number
) {
  const vmaPercent = toOptionalInt(vmaPercentRaw) ?? null
  const paceFromVma = vmaPercent ? paceFromVmaPercent(athleteVma, vmaPercent) : undefined
  const paceTargetSecPerKm = paceFromVma ?? parseClockToSeconds(paceManual) ?? null
  const distanceMeters = toOptionalInt(distanceMetersRaw) ?? null
  const autoDurationSeconds =
    paceTargetSecPerKm && distanceMeters ? durationFromPaceAndDistance(paceTargetSecPerKm, distanceMeters) : null
  const durationSeconds = autoDurationSeconds ?? parseClockToSeconds(durationManual) ?? null
  return { vmaPercent, paceTargetSecPerKm, distanceMeters, durationSeconds }
}

function buildLegCreateData(leg: WorkoutBlockLegInput, order: number, athleteVma?: number) {
  const { vmaPercent, paceTargetSecPerKm, distanceMeters, durationSeconds } = computePaceAndDuration(
    leg.vmaPercent,
    leg.paceManual,
    leg.distanceMeters,
    leg.durationManual,
    athleteVma
  )
  return {
    order,
    distanceMeters,
    durationSeconds,
    vmaPercent,
    paceTargetSecPerKm,
    recoveryAfterSeconds: parseClockToSeconds(leg.recoveryAfter) ?? null,
  }
}

export function buildBlocksCreateData(blocks: WorkoutBlockInput[], athleteVma?: number) {
  return blocks.map((b, index) => {
    const legs = b.legs ?? []

    if (legs.length > 0) {
      // Bloc "portions enchaînées" (ex : 4 tours de 200m@A -> 300m@B -> 200m@A) : chaque
      // portion porte sa propre distance/allure, "sets" devient le nombre de tours.
      return {
        type: b.type,
        order: index,
        label: b.label || null,
        sets: toOptionalInt(b.sets) ?? null,
        repetitions: null,
        distanceMeters: null,
        durationSeconds: null,
        vmaPercent: null,
        paceTargetSecPerKm: null,
        recoveryDurationSeconds: null,
        recoveryBetweenSetsSeconds: parseClockToSeconds(b.recoveryBetweenSets) ?? null,
        intensity: b.intensity,
        legs: { create: legs.map((leg, legIndex) => buildLegCreateData(leg, legIndex, athleteVma)) },
      }
    }

    const { vmaPercent, paceTargetSecPerKm, distanceMeters, durationSeconds } = computePaceAndDuration(
      b.vmaPercent,
      b.paceManual,
      b.distanceMeters,
      b.durationManual,
      athleteVma
    )

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
    const sets = b.sets ?? 1

    if (b.legs) {
      const legList = b.legs.create
      const legsDistance = legList.reduce((sum, leg) => sum + (leg.distanceMeters ?? 0), 0)
      const legsDuration = legList.reduce((sum, leg) => sum + (leg.durationSeconds ?? 0), 0)
      // Récup après chaque portion sauf la dernière (la transition vers le tour suivant, ou la
      // fin du bloc, passe par recoveryBetweenSetsSeconds).
      const legsRecovery = legList.slice(0, -1).reduce((sum, leg) => sum + (leg.recoveryAfterSeconds ?? 0), 0)
      totalDistance += legsDistance * sets
      totalDuration += (legsDuration + legsRecovery) * sets
      if (b.recoveryBetweenSetsSeconds) totalDuration += b.recoveryBetweenSetsSeconds * (sets - 1)
      continue
    }

    const reps = b.repetitions ?? 1
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
