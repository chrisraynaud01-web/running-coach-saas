import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, parse, isValid } from "date-fns"
import { prisma } from "@/lib/prisma"
import { getCurrentCoach } from "@/lib/current-coach"
import { AthleteFilterSelect } from "@/components/dashboard/athlete-filter-select"
import { MonthNav } from "@/components/dashboard/month-nav"
import { MonthCalendar, type CalendarSession } from "@/components/dashboard/month-calendar"

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ athlete?: string; month?: string }>
}) {
  const { athlete: athleteFilter, month: monthParam } = await searchParams
  const coach = await getCurrentCoach()

  const parsedMonth = monthParam ? parse(monthParam, "yyyy-MM", new Date()) : new Date()
  const month = isValid(parsedMonth) ? parsedMonth : new Date()

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })

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
        scheduledDate: { gte: gridStart, lte: gridEnd },
      },
      select: {
        id: true,
        title: true,
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
    status: w.status,
    scheduledDate: w.scheduledDate,
    athleteId: w.athleteId,
    athleteName: `${w.athlete.firstName} ${w.athlete.lastName[0]}.`,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Calendrier</h1>
          <p className="text-sm text-muted-foreground">
            Les séances planifiées de vos athlètes, mois par mois.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AthleteFilterSelect athletes={athletes} basePath="/calendar" />
          <MonthNav month={month} basePath="/calendar" />
        </div>
      </div>

      <MonthCalendar
        month={month}
        sessions={sessions}
        showAthleteName={!athleteFilter}
        athleteHref={(athleteId) => `/athletes/${athleteId}`}
      />
    </div>
  )
}
