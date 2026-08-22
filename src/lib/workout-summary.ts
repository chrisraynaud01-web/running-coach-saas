import { secondsToClock } from "@/lib/time"
import { workoutTypeValues, workoutTypeLabels } from "@/lib/validations/workout"

// Regroupement par famille d'entraînement — 10 types pour ~7 teintes catégorielles
// distinctes (les familles proches, ex. fractionné court/long, partagent une teinte).
export const workoutTypeColor: Record<(typeof workoutTypeValues)[number], string> = {
  ENDURANCE_FONDAMENTALE: "var(--chart-1)",
  SORTIE_LONGUE: "var(--chart-1)",
  RECUPERATION: "var(--chart-1)",
  SEUIL: "var(--chart-4)",
  VMA: "var(--chart-2)",
  FRACTIONNE_COURT: "var(--chart-5)",
  FRACTIONNE_LONG: "var(--chart-5)",
  RENFORCEMENT: "var(--chart-3)",
  COMPETITION: "var(--color-critical)",
  AUTRE: "var(--muted-foreground)",
}

export const workoutTypeLegend = workoutTypeValues.map((t) => ({
  type: t,
  label: workoutTypeLabels[t],
  color: workoutTypeColor[t],
}))

export type BlockSummaryInput = {
  label: string | null
  sets: number | null
  repetitions: number | null
  distanceMeters: number | null
  vmaPercent: number | null
  paceTargetSecPerKm: number | null
  recoveryDurationSeconds: number | null
  recoveryBetweenSetsSeconds: number | null
}

// Reconstruit la notation coach classique, ex : "2 x (4 x 600m @ 3:55/km, r:1:15) R:3:00"
export function formatBlockSummary(b: BlockSummaryInput): string {
  const core =
    b.label ||
    [b.repetitions && `${b.repetitions}x`, b.distanceMeters && `${b.distanceMeters}m`]
      .filter(Boolean)
      .join(" ")

  const parts = [core]
  if (b.paceTargetSecPerKm) parts.push(`@ ${secondsToClock(b.paceTargetSecPerKm)}/km`)
  else if (b.vmaPercent) parts.push(`${b.vmaPercent}% VMA`)
  if (b.recoveryDurationSeconds && (b.repetitions ?? 1) > 1) {
    parts.push(`r:${secondsToClock(b.recoveryDurationSeconds)}`)
  }

  let summary = parts.filter(Boolean).join(" ")

  if (b.sets && b.sets > 1) {
    summary = `${b.sets} x (${summary})`
    if (b.recoveryBetweenSetsSeconds) {
      summary += ` R:${secondsToClock(b.recoveryBetweenSetsSeconds)}`
    }
  }

  return summary
}

export function totalReps(b: { sets: number | null; repetitions: number | null }): number {
  return (b.sets ?? 1) * (b.repetitions ?? 1)
}
