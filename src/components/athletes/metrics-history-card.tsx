"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate, formatPace } from "@/lib/format"
import type { AthleteMetricsInput } from "@/lib/validations/metrics"
import { MetricsFormDialog, type AthleteMetricsRecord } from "@/components/athletes/metrics-form-dialog"

type ActionResult = { success: true } | { success: false; error: string }

export type MetricsHistoryEntry = AthleteMetricsRecord & { recordedAt: Date }

export function MetricsHistoryCard({
  history,
  updateAction,
  deleteAction,
}: {
  history: MetricsHistoryEntry[]
  updateAction: (metricsId: string, values: AthleteMetricsInput) => Promise<ActionResult>
  deleteAction: (metricsId: string) => Promise<ActionResult>
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  if (history.length === 0) return null

  function handleDelete(metricsId: string) {
    startTransition(async () => {
      const result = await deleteAction(metricsId)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Relevé supprimé.")
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Historique des données sportives</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {history.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between gap-2 border-b pb-2 text-sm last:border-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{formatDate(m.recordedAt)}</p>
              <p className="truncate">
                {[
                  m.vma != null ? `VMA ${m.vma} km/h` : null,
                  m.weightKg != null ? `${m.weightKg} kg` : null,
                  m.pace5k ? `5 km ${formatPace(m.pace5k)}` : null,
                  m.pace10k ? `10 km ${formatPace(m.pace10k)}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <MetricsFormDialog metrics={m} updateAction={updateAction} />
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-[--color-critical]"
                aria-label="Supprimer ce relevé"
                disabled={pending}
                onClick={() => handleDelete(m.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
