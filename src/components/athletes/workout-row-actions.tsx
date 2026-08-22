"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { CheckCircle2, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { deleteWorkout, markWorkoutCompleted } from "@/app/(app)/athletes/[id]/actions"
import { WorkoutFormDialog, type WorkoutRecord } from "@/components/athletes/add-workout-dialog"

export function WorkoutRowActions({
  workout,
  athleteId,
  athleteVma,
}: {
  workout: WorkoutRecord & { status: string }
  athleteId: string
  athleteVma?: number | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = React.useState(false)

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label="Modifier la séance"
        disabled={isPending}
        onClick={() => setEditOpen(true)}
      >
        <Pencil className="size-4" />
      </Button>
      {workout.status !== "COMPLETED" && (
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Marquer comme réalisée"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              await markWorkoutCompleted(workout.id, athleteId)
              router.refresh()
            })
          }
        >
          <CheckCircle2 className="size-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-muted-foreground hover:text-[--color-critical]"
        aria-label="Supprimer la séance"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await deleteWorkout(workout.id, athleteId)
            toast.success("Séance supprimée.")
            router.refresh()
          })
        }
      >
        <Trash2 className="size-4" />
      </Button>

      <WorkoutFormDialog
        athleteId={athleteId}
        athleteVma={athleteVma}
        workout={workout}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  )
}
