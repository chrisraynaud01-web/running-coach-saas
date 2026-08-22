import Link from "next/link"
import { startOfYear, endOfYear, eachMonthOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { workoutTypeColor } from "@/lib/workout-summary"
import { workoutTypeValues } from "@/lib/validations/workout"
import type { CalendarSession } from "@/components/dashboard/month-calendar"

export function YearOverview({
  year,
  sessions,
  basePath,
}: {
  year: Date
  sessions: CalendarSession[]
  /** Quand fourni, chaque jour devient un lien vers la vue jour de cette date. */
  basePath?: string
}) {
  const months = eachMonthOfInterval({ start: startOfYear(year), end: endOfYear(year) })

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {months.map((month) => (
        <MiniMonth key={month.toISOString()} month={month} sessions={sessions} basePath={basePath} />
      ))}
    </div>
  )
}

function MiniMonth({
  month,
  sessions,
  basePath,
}: {
  month: Date
  sessions: CalendarSession[]
  basePath?: string
}) {
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const label = format(month, "MMMM", { locale: fr })

  return (
    <div className="rounded-md border p-2">
      <p className="mb-1.5 px-1 text-xs font-medium capitalize text-foreground">{label}</p>
      <div className="grid grid-cols-7 gap-[3px]">
        {days.map((day) => {
          const daySessions = sessions.filter((s) => isSameDay(s.scheduledDate, day))
          const inMonth = isSameMonth(day, month)
          const dominant = daySessions[0]
          const dotColor = dominant
            ? workoutTypeColor[dominant.type as (typeof workoutTypeValues)[number]] ?? "var(--muted-foreground)"
            : undefined

          const cell = (
            <div
              className={cn(
                "flex aspect-square items-center justify-center rounded-[3px] text-[9px] tabular-nums",
                !inMonth && "opacity-0",
                isToday(day) && inMonth && "ring-1 ring-primary"
              )}
              style={{ backgroundColor: dotColor ?? "var(--muted)" }}
              title={inMonth ? `${format(day, "d MMM", { locale: fr })} — ${daySessions.length} séance${daySessions.length > 1 ? "s" : ""}` : undefined}
            >
              <span className={dotColor ? "text-white/90" : "text-muted-foreground/50"}>
                {inMonth ? format(day, "d") : ""}
              </span>
            </div>
          )

          if (!inMonth || !basePath) {
            return <div key={day.toISOString()}>{cell}</div>
          }

          const sep = basePath.includes("?") ? "&" : "?"
          return (
            <Link key={day.toISOString()} href={`${basePath}${sep}view=day&date=${format(day, "yyyy-MM-dd")}`}>
              {cell}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
