import Link from "next/link"
import { CheckCircle2, XCircle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { workoutTypeColor } from "@/lib/workout-summary"
import { workoutTypeValues, workoutTypeLabels } from "@/lib/validations/workout"
import { timeOfDayFromDate, timeOfDayLabels } from "@/lib/time"
import type { CalendarSession } from "@/components/dashboard/month-calendar"

const TIME_OF_DAY_ORDER = { MORNING: 0, AFTERNOON: 1, EVENING: 2 } as const

export function DayAgenda({
  sessions,
  athleteHref,
}: {
  sessions: CalendarSession[]
  athleteHref?: (athleteId: string) => string
}) {
  const sorted = [...sessions].sort(
    (a, b) => TIME_OF_DAY_ORDER[timeOfDayFromDate(a.scheduledDate)] - TIME_OF_DAY_ORDER[timeOfDayFromDate(b.scheduledDate)]
  )

  if (sorted.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        Aucune séance ce jour-là.
      </div>
    )
  }

  return (
    <div className="divide-y rounded-md border">
      {sorted.map((s) => {
        const dotColor = workoutTypeColor[s.type as (typeof workoutTypeValues)[number]] ?? "var(--muted-foreground)"
        const content = (
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-muted/40">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
              <div className="min-w-0">
                <p
                  className={cn(
                    "truncate text-sm font-medium",
                    s.status === "SKIPPED" && "text-muted-foreground line-through"
                  )}
                >
                  {s.athleteName} — {s.title}
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {timeOfDayLabels[timeOfDayFromDate(s.scheduledDate)]}
                  <span>·</span>
                  {workoutTypeLabels[s.type as (typeof workoutTypeValues)[number]] ?? s.type}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="shrink-0 text-xs">
              {s.status === "COMPLETED" ? (
                <span className="flex items-center gap-1 text-[--color-good]">
                  <CheckCircle2 className="size-3" /> Réalisée
                </span>
              ) : s.status === "SKIPPED" ? (
                <span className="flex items-center gap-1 text-[--color-critical]">
                  <XCircle className="size-3" /> Manquée
                </span>
              ) : (
                "Planifiée"
              )}
            </Badge>
          </div>
        )
        return (
          <Link key={s.id} href={athleteHref ? athleteHref(s.athleteId) : "#"} className="block">
            {content}
          </Link>
        )
      })}
    </div>
  )
}
