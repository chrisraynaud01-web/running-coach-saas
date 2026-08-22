import Link from "next/link"
import { Users, CalendarCheck, Gauge, HeartPulse, UserX } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/dashboard/stat-card"
import { MonthCalendar } from "@/components/dashboard/month-calendar"
import { WorkoutTypeChart } from "@/components/dashboard/workout-type-chart"
import { AlertPanel } from "@/components/dashboard/alert-panel"
import { UpcomingEvents } from "@/components/dashboard/upcoming-events"
import { AthleteFilterSelect } from "@/components/dashboard/athlete-filter-select"
import { getCurrentCoach } from "@/lib/current-coach"
import { getDashboardData } from "./queries"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ athlete?: string }>
}) {
  const { athlete: athleteFilter } = await searchParams
  const coach = await getCurrentCoach()

  const data = await getDashboardData(coach.id, athleteFilter)
  const athletes = data.athletes
  const calendarSessions = data.calendarSessions

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
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold">
              Calendrier des séances — {calendarSessions.monthLabel}
            </CardTitle>
            <Link
              href="/calendar"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Calendrier complet
            </Link>
          </CardHeader>
          <CardContent>
            <MonthCalendar
              month={calendarSessions.month}
              sessions={calendarSessions.sessions}
              showAthleteName={!athleteFilter}
              maxPerDay={2}
              athleteHref={(athleteId) => `/athletes/${athleteId}`}
            />
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
