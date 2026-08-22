import Link from "next/link"
import { CheckCircle2, XCircle } from "lucide-react"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from "date-fns"
import { cn } from "@/lib/utils"
import { workoutTypeColor, workoutTypeLegend } from "@/lib/workout-summary"
import { workoutTypeValues } from "@/lib/validations/workout"

export type CalendarSession = {
  id: string
  title: string
  type: string
  status: string
  scheduledDate: Date
  athleteId: string
  athleteName: string
}

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

export function MonthCalendar({
  month,
  sessions,
  showAthleteName = true,
  maxPerDay = 3,
  athleteHref,
}: {
  month: Date
  sessions: CalendarSession[]
  showAthleteName?: boolean
  maxPerDay?: number
  athleteHref?: (athleteId: string) => string
}) {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="grid grid-cols-7 border-b bg-muted/40 text-xs font-medium text-muted-foreground">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="px-2 py-1.5 text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const daySessions = sessions.filter((s) => isSameDay(s.scheduledDate, day))
          const inMonth = isSameMonth(day, month)
          const visible = daySessions.slice(0, maxPerDay)
          const overflow = daySessions.length - visible.length

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[84px] border-b border-r p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0",
                !inMonth && "bg-muted/20"
              )}
            >
              <p
                className={cn(
                  "mb-1 text-xs tabular-nums",
                  inMonth ? "text-foreground" : "text-muted-foreground/60",
                  isToday(day) &&
                    "inline-flex size-5 items-center justify-center rounded-full bg-primary font-medium text-primary-foreground"
                )}
              >
                {format(day, "d")}
              </p>
              <div className="space-y-0.5">
                {visible.map((s) => {
                  const dotColor = workoutTypeColor[s.type as (typeof workoutTypeValues)[number]] ?? "var(--muted-foreground)"
                  const content = (
                    <span
                      className={cn(
                        "flex items-center gap-1 truncate rounded bg-muted/60 px-1 py-0.5 text-[11px] leading-tight text-foreground/90 hover:bg-muted",
                        s.status === "SKIPPED" && "text-muted-foreground line-through opacity-70"
                      )}
                    >
                      {s.status === "COMPLETED" ? (
                        <CheckCircle2 className="size-2.5 shrink-0 text-[--color-good]" />
                      ) : s.status === "SKIPPED" ? (
                        <XCircle className="size-2.5 shrink-0 text-[--color-critical]" />
                      ) : (
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: dotColor }}
                        />
                      )}
                      <span className="truncate">
                        {showAthleteName ? `${s.athleteName} — ${s.title}` : s.title}
                      </span>
                    </span>
                  )
                  return (
                    <Link
                      key={s.id}
                      href={athleteHref ? athleteHref(s.athleteId) : "#"}
                      className="block"
                    >
                      {content}
                    </Link>
                  )
                })}
                {overflow > 0 && (
                  <p className="px-1 text-[11px] text-muted-foreground">+{overflow} autre{overflow > 1 ? "s" : ""}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <CalendarLegend sessions={sessions} />
    </div>
  )
}

function CalendarLegend({ sessions }: { sessions: CalendarSession[] }) {
  const typesInUse = new Set(sessions.map((s) => s.type))
  const entries = workoutTypeLegend.filter((t) => typesInUse.has(t.type))
  if (entries.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t bg-muted/20 px-2 py-1.5 text-[11px] text-muted-foreground">
      {entries.map((t) => (
        <span key={t.type} className="flex items-center gap-1">
          <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: t.color }} />
          {t.label}
        </span>
      ))}
    </div>
  )
}

