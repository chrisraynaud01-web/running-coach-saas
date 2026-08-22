"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { markMyWorkoutCompleted } from "@/app/athlete/actions"

export function MarkCompleteButton({ workoutId }: { workoutId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await markMyWorkoutCompleted(workoutId)
          router.refresh()
        })
      }
    >
      <CheckCircle2 className="size-4" />
      Réalisée
    </Button>
  )
}
