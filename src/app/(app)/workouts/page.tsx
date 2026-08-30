import { startOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { prisma } from "@/lib/prisma"
import { getCurrentCoach } from "@/lib/current-coach"
import { Card, CardContent } from "@/components/ui/card"
import { WorkoutsFilterBar } from "@/components/workouts/workouts-filter-bar"
import { BulkWorkoutDialog } from "@/components/workouts/bulk-workout-dialog"
import { WorkoutListItem } from "@/components/athletes/workout-list-item"

function dateRangeForPeriod(period: string) {
  const now = new Date()
  switch (period) {
    case "week":
      return { gte: startOfWeek(now, { weekStartsOn: 1 }), lte: endOfWeek(now, { weekStartsOn: 1 }) }
    case "month":
      return { gte: startOfMonth(now), lte: endOfMonth(now) }
    case "upcoming":
      // Les séances du jour restent visibles toute la journée, quelle que soit l'heure
      // actuelle — comparer à l'instant précis exclurait une séance du matin dès 7h passées.
      return { gte: startOfDay(now) }
    case "all":
    default:
      return undefined
  }
}

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ athlete?: string; period?: string }>
}) {
  const { athlete: athleteId, period = "upcoming" } = await searchParams
  const coach = await getCurrentCoach()

  const athletesRaw = await prisma.athlete.findMany({
    where: { coachId: coach.id, status: { not: "ARCHIVED" } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      metricsHistory: { orderBy: { recordedAt: "desc" }, take: 1, select: { vma: true } },
    },
    orderBy: { firstName: "asc" },
  })
  const athletes = athletesRaw.map((a) => ({
    id: a.id,
    firstName: a.firstName,
    lastName: a.lastName,
    vma: a.metricsHistory[0]?.vma ?? null,
  }))

  const scheduledDate = dateRangeForPeriod(period)

  const workouts = await prisma.workout.findMany({
    where: {
      athlete: athleteId ? { coachId: coach.id, id: athleteId } : { coachId: coach.id },
      ...(scheduledDate ? { scheduledDate } : {}),
    },
    orderBy: { scheduledDate: period === "upcoming" ? "asc" : "desc" },
    take: 100,
    include: {
      blocks: { orderBy: { order: "asc" } },
      athlete: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          metricsHistory: { orderBy: { recordedAt: "desc" }, take: 1, select: { vma: true } },
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Séances</h1>
          <p className="text-sm text-muted-foreground">
            {workouts.length} séance{workouts.length > 1 ? "s" : ""} — {athletes.length} athlète
            {athletes.length > 1 ? "s" : ""}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <WorkoutsFilterBar athletes={athletes} />
          <BulkWorkoutDialog athletes={athletes} />
        </div>
      </div>

      <Card>
        <CardContent className="space-y-2 p-4">
          {workouts.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucune séance pour ce filtre.
            </p>
          )}
          {workouts.map((w) => (
            <WorkoutListItem
              key={w.id}
              workout={w}
              athleteId={w.athlete.id}
              athleteVma={w.athlete.metricsHistory[0]?.vma}
              athleteName={`${w.athlete.firstName} ${w.athlete.lastName}`}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
