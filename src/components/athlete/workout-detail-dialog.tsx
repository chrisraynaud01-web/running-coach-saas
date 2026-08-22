"use client"

import * as React from "react"
import { CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { WorkoutResultDialog, type ResultBlock } from "@/components/athlete/workout-result-dialog"
import { MarkCompleteButton } from "@/components/athlete/mark-complete-button"
import { JournalEntryDialog } from "@/components/athlete/journal-entry-dialog"
import { workoutTypeLabels, workoutBlockTypeLabels } from "@/lib/validations/workout"
import { formatWorkoutSchedule, formatDistance, formatDuration } from "@/lib/format"
import { secondsToClock } from "@/lib/time"
import { formatBlockSummary, totalReps } from "@/lib/workout-summary"

export type WorkoutDetailBlock = ResultBlock & {
  durationSeconds: number | null
  actualDurationSeconds: number | null
  actualRepSecondsList: number[]
}

export type WorkoutDetailRecord = {
  id: string
  title: string
  type: string
  status: string
  scheduledDate: Date
  plannedDistanceMeters: number | null
  plannedDurationSeconds: number | null
  coachNotes: string | null
  blocks: WorkoutDetailBlock[]
}

export function WorkoutDetailDialog({ workout }: { workout: WorkoutDetailRecord }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-start justify-between gap-3 border-b py-2.5 text-left last:border-0 hover:bg-muted/30"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{workout.title}</p>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {workoutTypeLabels[workout.type as keyof typeof workoutTypeLabels] ?? workout.type}
            </Badge>
            {workout.status === "COMPLETED" && (
              <Badge className="shrink-0 bg-[--color-good]/15 text-[--color-good] text-xs" variant="outline">
                <CheckCircle2 className="size-3" />
                Réalisée
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatWorkoutSchedule(workout.scheduledDate)} · {formatDistance(workout.plannedDistanceMeters)} ·{" "}
            {formatDuration(workout.plannedDurationSeconds)}
          </p>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{workout.title}</DialogTitle>
            <DialogDescription>
              {workoutTypeLabels[workout.type as keyof typeof workoutTypeLabels] ?? workout.type} ·{" "}
              {formatWorkoutSchedule(workout.scheduledDate)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {formatDistance(workout.plannedDistanceMeters)} · {formatDuration(workout.plannedDurationSeconds)}
            </p>

            {workout.blocks.length > 0 && (
              <ul className="space-y-2">
                {workout.blocks.map((b) => {
                  const reps = totalReps(b)
                  const filledReps = b.actualRepSecondsList.filter((s) => s > 0)
                  return (
                    <li key={b.id} className="rounded-md border p-2.5 text-sm">
                      <p className="font-medium text-foreground/90">
                        {workoutBlockTypeLabels[b.type as keyof typeof workoutBlockTypeLabels] ?? b.type}
                      </p>
                      <p className="text-muted-foreground">
                        {formatBlockSummary(b)}
                        {b.durationSeconds ? ` (${secondsToClock(b.durationSeconds)}${reps > 1 ? "/rep" : ""})` : ""}
                      </p>
                      {reps > 1 && filledReps.length > 0 ? (
                        <p className="mt-1 text-foreground/80">
                          Réalisé : {b.actualRepSecondsList.map((s) => (s > 0 ? secondsToClock(s) : "—")).join(", ")}
                        </p>
                      ) : (
                        b.actualDurationSeconds && (
                          <p className="mt-1 text-foreground/80">
                            Réalisé : {formatDuration(b.actualDurationSeconds)}
                          </p>
                        )
                      )}
                      {b.actualNotes && <p className="mt-1 italic text-muted-foreground">« {b.actualNotes} »</p>}
                    </li>
                  )
                })}
              </ul>
            )}

            {workout.coachNotes && (
              <p className="rounded-md bg-muted/50 px-2.5 py-2 text-sm text-muted-foreground">
                {workout.coachNotes}
              </p>
            )}
          </div>

          <DialogFooter className="flex-row flex-wrap items-center justify-end gap-2">
            {workout.blocks.length > 0 ? (
              <WorkoutResultDialog workoutId={workout.id} blocks={workout.blocks} isEdit={workout.status === "COMPLETED"} />
            ) : (
              workout.status !== "COMPLETED" && <MarkCompleteButton workoutId={workout.id} />
            )}
            <JournalEntryDialog workoutId={workout.id} workoutTitle={workout.title} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
