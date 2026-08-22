import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay,
  parse,
  isValid,
} from "date-fns"
import { prisma } from "@/lib/prisma"
import { getCurrentCoach } from "@/lib/current-coach"
import { AthleteFilterSelect } from "@/components/dashboard/athlete-filter-select"
import { PeriodNav, type CalendarView } from "@/components/dashboard/period-nav"
import { CalendarViewTabs } from "@/components/dashboard/calendar-view-tabs"
import { MonthCalendar, WeekCalendar, type CalendarSession } from "@/components/dashboard/month-calendar"
import { DayAgenda } from "@/components/dashboard/day-agenda"
import { YearOverview } from "@/components/dashboard/year-overview"

const VALID_VIEWS: CalendarView[] = ["day", "week", "month", "year"]

function rangeForView(view: CalendarView, date: Date) {
  switch (view) {
    case "day":
      return { start: startOfDay(date), end: endOfDay(date) }
    case "week":
      return { start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) }
    case "month":
      return { start: startOfWeek(startOfMonth(date), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(date), { weekStartsOn: 1 }) }
    case "year":
      return { start: startOfYear(date), end: endOfYear(date) }
  }
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ athlete?: string; date?: string; view?: string }>
}) {
  const { athlete: athleteFilter, date: dateParam, view: viewParam } = await searchParams
  const coach = await getCurrentCoach()

  const view: CalendarView = VALID_VIEWS.includes(viewParam as CalendarView) ? (viewParam as CalendarView) : "month"
  const parsedDate = dateParam ? parse(dateParam, "yyyy-MM-dd", new Date()) : new Date()
  const date = isValid(parsedDate) ? parsedDate : new Date()

  const { start, end } = rangeForView(view, date)

  const athleteScope = athleteFilter ? { coachId: coach.id, id: athleteFilter } : { coachId: coach.id }

  const [athletes, workouts] = await Promise.all([
    prisma.athlete.findMany({
      where: { coachId: coach.id, status: { not: "ARCHIVED" } },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.workout.findMany({
      where: {
        athlete: athleteScope,
        scheduledDate: { gte: start, lte: end },
      },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        scheduledDate: true,
        athleteId: true,
        athlete: { select: { firstName: true, lastName: true } },
      },
      orderBy: { scheduledDate: "asc" },
    }),
  ])

  const sessions: CalendarSession[] = workouts.map((w) => ({
    id: w.id,
    title: w.title,
    type: w.type,
    status: w.status,
    scheduledDate: w.scheduledDate,
    athleteId: w.athleteId,
    athleteName: `${w.athlete.firstName} ${w.athlete.lastName[0]}.`,
  }))

  const athleteHref = (athleteId: string) => `/athletes/${athleteId}`
  const basePathWithAthlete = athleteFilter ? `/calendar?athlete=${athleteFilter}` : "/calendar"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Calendrier</h1>
          <p className="text-sm text-muted-foreground">
            Les séances planifiées de vos athlètes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AthleteFilterSelect athletes={athletes} basePath="/calendar" />
          <CalendarViewTabs basePath="/calendar" />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <PeriodNav date={date} view={view} basePath="/calendar" />
      </div>

      {view === "day" && <DayAgenda sessions={sessions} athleteHref={athleteHref} />}
      {view === "week" && (
        <WeekCalendar weekStart={start} sessions={sessions} showAthleteName={!athleteFilter} athleteHref={athleteHref} />
      )}
      {view === "month" && (
        <MonthCalendar month={date} sessions={sessions} showAthleteName={!athleteFilter} athleteHref={athleteHref} />
      )}
      {view === "year" && <YearOverview year={date} sessions={sessions} basePath={basePathWithAthlete} />}
    </div>
  )
}
