import { secondsToClock } from "@/lib/time"

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
