import { CalendarCheck, Gauge } from "lucide-react"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { prisma } from "@/lib/prisma"
import { getCurrentAthlete } from "@/lib/current-athlete"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/dashboard/stat-card"
import { MonthCalendar, type CalendarSession } from "@/components/dashboard/month-calendar"
import { WorkoutDetailDialog } from "@/components/athlete/workout-detail-dialog"

export default async function AthletePlanningPage() {
  const athlete = await getCurrentAthlete()

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const calendarGridStart = startOfWeek(startOfMonth(now), { weekStartsOn: 1 })
  const calendarGridEnd = endOfWeek(endOfMonth(now), { weekStartsOn: 1 })

  const [workoutsRaw, weekWorkouts, calendarWorkouts] = await Promise.all([
    prisma.workout.findMany({
      where: { athleteId: athlete.id },
      orderBy: { scheduledDate: "desc" },
      take: 20,
      include: { blocks: { orderBy: { order: "asc" } } },
    }),
    prisma.workout.findMany({
      where: { athleteId: athlete.id, scheduledDate: { gte: weekStart, lte: weekEnd } },
      select: { plannedDistanceMeters: true, actualDistanceMeters: true },
    }),
    prisma.workout.findMany({
      where: { athleteId: athlete.id, scheduledDate: { gte: calendarGridStart, lte: calendarGridEnd } },
      select: { id: true, title: true, type: true, status: true, scheduledDate: true },
    }),
  ])

  const journalRpes = await prisma.journalEntry.findMany({
    where: { athleteId: athlete.id, workoutId: { in: workoutsRaw.map((w) => w.id) } },
    select: { workoutId: true, rpe: true },
  })
  const rpeByWorkoutId = new Map(journalRpes.map((e) => [e.workoutId, e.rpe]))
  const workouts = workoutsRaw.map((w) => ({ ...w, rpe: rpeByWorkoutId.get(w.id) ?? null }))

  const upcoming = workouts.filter((w) => w.status === "PLANNED")
  const past = workouts.filter((w) => w.status !== "PLANNED")

  const weeklyLoadKm =
    weekWorkouts.reduce((sum, w) => sum + (w.actualDistanceMeters ?? w.plannedDistanceMeters ?? 0), 0) / 1000

  const calendarSessions: CalendarSession[] = calendarWorkouts.map((w) => ({
    id: w.id,
    title: w.title,
    type: w.type,
    status: w.status,
    scheduledDate: w.scheduledDate,
    athleteId: athlete.id,
    athleteName: athlete.firstName,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Mon planning</h1>
        <p className="text-sm text-muted-foreground">
          Bonjour {athlete.firstName}, voici tes prochaines séances. Clique sur une séance pour
          voir le détail.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Séances cette semaine" value={String(weekWorkouts.length)} icon={CalendarCheck} />
        <StatCard label="Charge cette semaine (km)" value={weeklyLoadKm.toFixed(1)} icon={Gauge} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Mon calendrier</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthCalendar month={now} sessions={calendarSessions} showAthleteName={false} maxPerDay={3} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Séances à venir ({upcoming.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 && (
            <p className="py-2 text-sm text-muted-foreground">Aucune séance planifiée pour l&apos;instant.</p>
          )}
          {upcoming.map((w) => (
            <WorkoutDetailDialog key={w.id} workout={w} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Historique</CardTitle>
        </CardHeader>
        <CardContent>
          {past.length === 0 && (
            <p className="py-2 text-sm text-muted-foreground">Aucune séance enregistrée pour l&apos;instant.</p>
          )}
          {past.map((w) => (
            <WorkoutDetailDialog key={w.id} workout={w} />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
