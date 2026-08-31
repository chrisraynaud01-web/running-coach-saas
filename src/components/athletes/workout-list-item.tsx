import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { WorkoutRowActions } from "@/components/athletes/workout-row-actions"
import { workoutTypeLabels, workoutBlockTypeLabels } from "@/lib/validations/workout"
import { formatWorkoutSchedule, formatDistance, formatDuration } from "@/lib/format"
import { secondsToClock } from "@/lib/time"
import { formatBlockSummary, totalReps, workoutTypeColor } from "@/lib/workout-summary"

export type WorkoutListItemData = {
  id: string
  title: string
  type: string
  status: string
  scheduledDate: Date
  plannedDistanceMeters: number | null
  plannedDurationSeconds: number | null
  coachNotes: string | null
  blocks: {
    id: string
    type: string
    label: string | null
    sets: number | null
    repetitions: number | null
    distanceMeters: number | null
    durationSeconds: number | null
    recoveryDurationSeconds: number | null
    recoveryBetweenSetsSeconds: number | null
    vmaPercent: number | null
    paceTargetSecPerKm: number | null
    targetRpe: number | null
    actualDurationSeconds: number | null
    actualRepSecondsList: number[]
    actualNotes: string | null
    legs: {
      distanceMeters: number | null
      durationSeconds: number | null
      vmaPercent: number | null
      paceTargetSecPerKm: number | null
      recoveryAfterSeconds: number | null
    }[]
  }[]
}

export function WorkoutListItem({
  workout,
  athleteId,
  athleteVma,
  athleteName,
}: {
  workout: WorkoutListItemData
  athleteId: string
  athleteVma?: number | null
  athleteName?: string
}) {
  const typeColor = workoutTypeColor[workout.type as keyof typeof workoutTypeColor] ?? "var(--muted-foreground)"

  return (
    <div className="flex items-start justify-between gap-3 border-b py-2.5 last:border-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{workout.title}</p>
          <Badge
            variant="outline"
            className="shrink-0 border-transparent text-xs"
            style={{ backgroundColor: `color-mix(in srgb, ${typeColor} 15%, transparent)`, color: typeColor }}
          >
            {workoutTypeLabels[workout.type as keyof typeof workoutTypeLabels] ?? workout.type}
          </Badge>
          {workout.status === "COMPLETED" && (
            <Badge className="shrink-0 bg-[--color-good]/15 text-[--color-good] text-xs" variant="outline">
              Réalisée
            </Badge>
          )}
          {athleteName && (
            <Link
              href={`/athletes/${athleteId}`}
              className="shrink-0 truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              {athleteName}
            </Link>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatWorkoutSchedule(workout.scheduledDate)} · {formatDistance(workout.plannedDistanceMeters)} ·{" "}
          {formatDuration(workout.plannedDurationSeconds)}
        </p>
        {workout.blocks.length > 0 && (
          <ul className="mt-1.5 space-y-0.5">
            {workout.blocks.map((b) => {
              const reps = totalReps(b)
              const filledReps = b.actualRepSecondsList.filter((s) => s > 0)
              return (
                <li key={b.id} className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">
                    {workoutBlockTypeLabels[b.type as keyof typeof workoutBlockTypeLabels] ?? b.type}
                  </span>
                  {" — "}
                  {formatBlockSummary(b)}
                  {b.durationSeconds
                    ? ` (${secondsToClock(b.durationSeconds)}${reps > 1 ? "/rep" : ""})`
                    : ""}
                  {reps > 1 && filledReps.length > 0 ? (
                    <span className="text-foreground/80">
                      {" · réalisé "}
                      {b.actualRepSecondsList.map((s) => (s > 0 ? secondsToClock(s) : "—")).join(", ")}
                    </span>
                  ) : (
                    b.actualDurationSeconds && (
                      <span className="text-foreground/80">
                        {" · réalisé "}
                        {formatDuration(b.actualDurationSeconds)}
                      </span>
                    )
                  )}
                  {b.actualNotes && ` — "${b.actualNotes}"`}
                </li>
              )
            })}
          </ul>
        )}
      </div>
      <WorkoutRowActions workout={workout} athleteId={athleteId} athleteVma={athleteVma} />
    </div>
  )
}
