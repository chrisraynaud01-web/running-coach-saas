import { Users, CalendarCheck, Gauge, HeartPulse, UserX } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/dashboard/stat-card"
import { WeeklyLoadChart } from "@/components/dashboard/weekly-load-chart"
import { WorkoutTypeChart } from "@/components/dashboard/workout-type-chart"
import { AlertPanel } from "@/components/dashboard/alert-panel"
import { UpcomingEvents } from "@/components/dashboard/upcoming-events"
import { AthleteFilterSelect } from "@/components/dashboard/athlete-filter-select"
import { getCurrentCoach } from "@/lib/current-coach"
import { prisma } from "@/lib/prisma"
import { getDashboardData } from "./queries"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ athlete?: string }>
}) {
  const { athlete: athleteFilter } = await searchParams
  const coach = await getCurrentCoach()

  const [data, athletes] = await Promise.all([
    getDashboardData(coach.id, athleteFilter),
    prisma.athlete.findMany({
      where: { coachId: coach.id, status: { not: "ARCHIVED" } },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Vue d&apos;ensemble de votre groupe d&apos;athlètes.
          </p>
        </div>
        <AthleteFilterSelect athletes={athletes} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Athlètes" value={String(data.athleteCount)} icon={Users} />
        <StatCard
          label="Séances cette semaine"
          value={String(data.sessionsThisWeek)}
          icon={CalendarCheck}
        />
        <StatCard
          label="Charge hebdo. (km)"
          value={data.weeklyLoadKm.toFixed(0)}
          icon={Gauge}
          trendPct={data.weeklyLoadTrendPct}
        />
        <StatCard
          label="Taux de complétion"
          value={`${data.completionRatePct}%`}
          icon={HeartPulse}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Charge d&apos;entraînement hebdomadaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyLoadChart data={data.weeklyLoad} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Répartition par type</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkoutTypeChart data={data.workoutTypeBreakdown} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <AlertPanel
          title="Alertes blessures"
          icon={HeartPulse}
          tone="critical"
          emptyLabel="Aucune alerte en cours."
          items={data.injuryAlerts.map((a) => ({
            primary: a.athlete,
            secondary: `${a.detail} — ${a.since}`,
          }))}
        />
        <AlertPanel
          title="Athlètes inactifs"
          icon={UserX}
          tone="warning"
          emptyLabel="Tous vos athlètes sont actifs."
          items={data.inactiveAthletes.map((a) => ({
            primary: a.athlete,
            secondary: `Dernière activité ${a.lastActivity}`,
          }))}
        />
        <UpcomingEvents events={data.upcomingEvents} />
      </div>
    </div>
  )
}
