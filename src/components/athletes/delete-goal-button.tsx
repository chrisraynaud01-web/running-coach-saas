"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

type ActionResult = { success: true } | { success: false; error: string }

export function DeleteGoalButton({
  goalId,
  deleteAction,
}: {
  goalId: string
  deleteAction: (goalId: string) => Promise<ActionResult>
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="text-muted-foreground hover:text-[--color-critical]"
      aria-label="Supprimer l'objectif"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await deleteAction(goalId)
          if (!result.success) {
            toast.error(result.error)
            return
          }
          toast.success("Objectif supprimé.")
          router.refresh()
        })
      }
    >
      <Trash2 className="size-3.5" />
    </Button>
  )
}
