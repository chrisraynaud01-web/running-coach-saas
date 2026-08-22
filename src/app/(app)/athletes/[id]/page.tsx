import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Mail, Phone, Cake, Target } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { getCurrentCoach } from "@/lib/current-coach"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AthleteStatusBadge } from "@/components/athletes/athlete-status-badge"
import { WorkoutFormDialog } from "@/components/athletes/add-workout-dialog"
import { WorkoutRowActions } from "@/components/athletes/workout-row-actions"
import { AthleteActionsMenu } from "@/components/athletes/athlete-actions-menu"
import { MetricsFormDialog } from "@/components/athletes/metrics-form-dialog"
import { AthleteAccessCard } from "@/components/athletes/athlete-access-card"
import { workoutTypeLabels, workoutBlockTypeLabels } from "@/lib/validations/workout"
import {
  formatDate,
  formatDateTime,
  formatDistance,
  formatDuration,
  formatPace,
} from "@/lib/format"
import { paceFromVmaPercent, secondsToClock } from "@/lib/time"

export default async function AthleteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const coach = await getCurrentCoach()

  const athlete = await prisma.athlete.findUnique({
    where: { id, coachId: coach.id },
    include: {
      goals: { orderBy: { createdAt: "desc" } },
      metricsHistory: { orderBy: { recordedAt: "desc" }, take: 1 },
      workouts: {
        orderBy: { scheduledDate: "desc" },
        take: 20,
        include: { blocks: { orderBy: { order: "asc" } } },
      },
    },
  })

  if (!athlete) notFound()

  const metrics = athlete.metricsHistory[0]
  const primaryGoal = athlete.goals.find((g) => g.isPrimary) ?? athlete.goals[0]
  const upcomingWorkouts = athlete.workouts.filter((w) => w.status === "PLANNED")
  const pastWorkouts = athlete.workouts.filter((w) => w.status !== "PLANNED")

  return (
    <div className="space-y-6">
      <Link
        href="/athletes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Retour aux athlètes
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback className="text-lg">
              {athlete.firstName[0]}
              {athlete.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">
                {athlete.firstName} {athlete.lastName}
              </h1>
              <AthleteStatusBadge status={athlete.status} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="size-3.5" /> {athlete.email}
              </span>
              {athlete.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5" /> {athlete.phone}
                </span>
              )}
              {athlete.birthDate && (
                <span className="flex items-center gap-1.5">
                  <Cake className="size-3.5" /> {formatDate(athlete.birthDate)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WorkoutFormDialog athleteId={athlete.id} athleteVma={metrics?.vma} />
          <AthleteActionsMenu athlete={athlete} redirectAfterDeleteTo="/athletes" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold">Données sportives</CardTitle>
            <MetricsFormDialog athleteId={athlete.id} />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-y-3 text-sm">
            <Metric label="VMA" value={metrics?.vma ? `${metrics.vma} km/h` : "—"} />
            <Metric label="FC Max" value={metrics?.maxHeartRate ? `${metrics.maxHeartRate} bpm` : "—"} />
            <Metric label="FC Repos" value={metrics?.restingHeartRate ? `${metrics.restingHeartRate} bpm` : "—"} />
            <Metric label="Poids" value={athlete.weightKg ? `${athlete.weightKg} kg` : "—"} />
            <Metric label="Allure 5km" value={formatPace(metrics?.pace5k)} />
            <Metric label="Allure 10km" value={formatPace(metrics?.pace10k)} />
            <Metric label="Allure semi" value={formatPace(metrics?.paceHalfMarathon)} />
            <Metric label="Allure marathon" value={formatPace(metrics?.paceMarathon)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Target className="size-4" /> Objectif principal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {primaryGoal ? (
              <div className="space-y-1">
                <p className="text-sm font-medium">{primaryGoal.title}</p>
                {primaryGoal.targetValue && (
                  <p className="text-sm text-muted-foreground">{primaryGoal.targetValue}</p>
                )}
                {primaryGoal.targetDate && (
                  <p className="text-xs text-muted-foreground">
                    Échéance : {formatDate(primaryGoal.targetDate)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun objectif défini.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Historique des objectifs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {athlete.goals.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun historique.</p>
            )}
            {athlete.goals.map((g) => (
              <div key={g.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{g.title}</span>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {g.status === "ACTIVE" ? "En cours" : g.status === "ACHIEVED" ? "Atteint" : "Abandonné"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <AthleteAccessCard athleteId={athlete.id} hasAccess={!!athlete.userId} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Séances à venir ({upcomingWorkouts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcomingWorkouts.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune séance planifiée.</p>
          )}
          {upcomingWorkouts.map((w) => (
            <WorkoutItem key={w.id} workout={w} athleteId={athlete.id} athleteVma={metrics?.vma} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Historique des séances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pastWorkouts.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune séance enregistrée.</p>
          )}
          {pastWorkouts.map((w) => (
            <WorkoutItem key={w.id} workout={w} athleteId={athlete.id} athleteVma={metrics?.vma} />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium tabular-nums">{value}</p>
    </div>
  )
}

function WorkoutItem({
  workout,
  athleteId,
  athleteVma,
}: {
  workout: {
    id: string
    title: string
    type: string
    status: string
    scheduledDate: Date
    plannedDistanceMeters: number | null
    plannedDurationSeconds: number | null
    coachNotes: string | null
    blocks: {
      id: string
      type: string
      label: string | null
      repetitions: number | null
      distanceMeters: number | null
      durationSeconds: number | null
      recoveryDurationSeconds: number | null
      vmaPercent: number | null
      intensity: string | null
    }[]
  }
  athleteId: string
  athleteVma?: number | null
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b py-2.5 last:border-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{workout.title}</p>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {workoutTypeLabels[workout.type as keyof typeof workoutTypeLabels] ?? workout.type}
          </Badge>
          {workout.status === "COMPLETED" && (
            <Badge className="shrink-0 bg-[--color-good]/15 text-[--color-good] text-xs" variant="outline">
              Réalisée
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDateTime(workout.scheduledDate)} · {formatDistance(workout.plannedDistanceMeters)} ·{" "}
          {formatDuration(workout.plannedDurationSeconds)}
        </p>
        {workout.blocks.length > 0 && (
          <ul className="mt-1.5 space-y-0.5">
            {workout.blocks.map((b) => (
              <li key={b.id} className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground/80">
                  {workoutBlockTypeLabels[b.type as keyof typeof workoutBlockTypeLabels] ?? b.type}
                </span>
                {" — "}
                {b.label ||
                  [
                    b.repetitions && `${b.repetitions}x`,
                    b.distanceMeters && `${b.distanceMeters}m`,
                    b.durationSeconds && `${Math.round(b.durationSeconds / 60)}min`,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                {b.recoveryDurationSeconds ? ` · récup ${b.recoveryDurationSeconds}s` : ""}
                {b.vmaPercent ? ` · ${b.vmaPercent}% VMA` : ""}
                {b.vmaPercent && athleteVma
                  ? ` (≈ ${secondsToClock(paceFromVmaPercent(athleteVma, b.vmaPercent))}/km)`
                  : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
      <WorkoutRowActions workout={workout} athleteId={athleteId} athleteVma={athleteVma} />
    </div>
  )
}
