import { secondsToClock } from "@/lib/time"
import { workoutTypeValues, workoutTypeLabels } from "@/lib/validations/workout"

// Regroupement par famille d'entraînement — 10 types pour ~7 teintes, dans l'ordre
// d'intensité croissante (bleu calme -> or -> orange -> rouge pour la VMA, l'effort le plus
// dur) ; renforcement et compétition suivent un axe différent (nature de l'effort / événement).
export const workoutTypeColor: Record<(typeof workoutTypeValues)[number], string> = {
  RECUPERATION: "var(--chart-1)",
  ENDURANCE_FONDAMENTALE: "var(--chart-1)",
  SORTIE_LONGUE: "var(--chart-1)",
  SEUIL: "var(--chart-4)",
  FRACTIONNE_COURT: "var(--chart-2)",
  FRACTIONNE_LONG: "var(--chart-2)",
  VMA: "var(--color-critical)",
  COMPETITION: "var(--chart-5)",
  RENFORCEMENT: "var(--chart-3)",
  AUTRE: "var(--muted-foreground)",
}

export const workoutTypeLegend = workoutTypeValues.map((t) => ({
  type: t,
  label: workoutTypeLabels[t],
  color: workoutTypeColor[t],
}))

export type LegSummaryInput = {
  distanceMeters: number | null
  vmaPercent: number | null
  paceTargetSecPerKm: number | null
  recoveryAfterSeconds: number | null
}

export type BlockSummaryInput = {
  label: string | null
  sets: number | null
  repetitions: number | null
  distanceMeters: number | null
  vmaPercent: number | null
  paceTargetSecPerKm: number | null
  recoveryDurationSeconds: number | null
  recoveryBetweenSetsSeconds: number | null
  legs?: LegSummaryInput[]
}

function formatLegPace(leg: LegSummaryInput): string {
  if (leg.paceTargetSecPerKm) return `@${secondsToClock(leg.paceTargetSecPerKm)}/km`
  if (leg.vmaPercent) return `${leg.vmaPercent}%VMA`
  return ""
}

// Ex : "4 tours de (200m @3:20/km r:20 -> 300m @85%VMA -> 200m @3:20/km) R:2:00"
function formatLeggedBlockSummary(b: BlockSummaryInput): string {
  const legs = b.legs!
  const sequence = legs
    .map((leg) => {
      const parts = [leg.distanceMeters ? `${leg.distanceMeters}m` : "", formatLegPace(leg)].filter(Boolean)
      return parts.join(" ")
    })
    .join(" → ")
  const recapRecoveries = legs
    .slice(0, -1)
    .map((leg) => (leg.recoveryAfterSeconds ? secondsToClock(leg.recoveryAfterSeconds) : null))

  let summary = sequence
  const sets = b.sets ?? 1
  if (sets > 1) {
    summary = `${sets} tours de (${sequence})`
    if (b.recoveryBetweenSetsSeconds) summary += ` R:${secondsToClock(b.recoveryBetweenSetsSeconds)}`
  }
  if (recapRecoveries.some(Boolean)) {
    summary += ` — r: ${recapRecoveries.map((r) => r ?? "0").join("/")}`
  }
  return b.label ? `${b.label} — ${summary}` : summary
}

// Reconstruit la notation coach classique, ex : "2 x (4 x 600m @ 3:55/km, r:1:15) R:3:00"
export function formatBlockSummary(b: BlockSummaryInput): string {
  if (b.legs && b.legs.length > 0) return formatLeggedBlockSummary(b)

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

export function totalReps(b: { sets: number | null; repetitions: number | null; legs?: unknown[] }): number {
  if (b.legs && b.legs.length > 0) return (b.sets ?? 1) * b.legs.length
  return (b.sets ?? 1) * (b.repetitions ?? 1)
}
