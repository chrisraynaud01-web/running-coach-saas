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
import { AthleteActionsMenu } from "@/components/athletes/athlete-actions-menu"
import { MetricsFormDialog } from "@/components/athletes/metrics-form-dialog"
import { MetricsHistoryCard } from "@/components/athletes/metrics-history-card"
import { AthleteAccessCard } from "@/components/athletes/athlete-access-card"
import { WorkoutListItem } from "@/components/athletes/workout-list-item"
import { GoalFormDialog } from "@/components/athletes/goal-form-dialog"
import { AthleteEvolutionCard } from "@/components/athletes/athlete-evolution-card"
import { goalStatusLabels } from "@/lib/validations/goal"
import { calculateAge, formatDate, formatPace, formatMemberSince } from "@/lib/format"
import { addAthleteMetrics, updateAthleteMetrics, deleteAthleteMetrics } from "@/app/(app)/athletes/[id]/metrics-actions"
import { createGoal, updateGoal, deleteGoal } from "@/app/(app)/athletes/[id]/goal-actions"
import { DeleteGoalButton } from "@/components/athletes/delete-goal-button"

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
      metricsHistory: { orderBy: { recordedAt: "desc" } },
      workouts: {
        orderBy: { scheduledDate: "desc" },
        take: 20,
        include: {
          blocks: { orderBy: { order: "asc" }, include: { legs: { orderBy: { order: "asc" } } } },
        },
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
                  <Cake className="size-3.5" /> {formatDate(athlete.birthDate)} (
                  {calculateAge(athlete.birthDate)} ans)
                </span>
              )}
              <span>{formatMemberSince(athlete.createdAt)}</span>
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
            <MetricsFormDialog action={addAthleteMetrics.bind(null, athlete.id)} />
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Target className="size-4" /> Objectif principal
            </CardTitle>
            {primaryGoal ? (
              <GoalFormDialog
                goal={primaryGoal}
                createAction={createGoal.bind(null, athlete.id)}
                updateAction={updateGoal.bind(null, athlete.id)}
              />
            ) : (
              <GoalFormDialog
                defaultPrimary
                createAction={createGoal.bind(null, athlete.id)}
                updateAction={updateGoal.bind(null, athlete.id)}
              />
            )}
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
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold">Historique des objectifs</CardTitle>
            {athlete.goals.length > 0 && (
              <GoalFormDialog
                createAction={createGoal.bind(null, athlete.id)}
                updateAction={updateGoal.bind(null, athlete.id)}
              />
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {athlete.goals.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun historique.</p>
            )}
            {athlete.goals.map((g) => (
              <div key={g.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{g.title}</span>
                <div className="flex shrink-0 items-center gap-1">
                  <Badge variant="outline" className="text-xs">
                    {goalStatusLabels[g.status as keyof typeof goalStatusLabels] ?? g.status}
                  </Badge>
                  <GoalFormDialog
                    goal={g}
                    createAction={createGoal.bind(null, athlete.id)}
                    updateAction={updateGoal.bind(null, athlete.id)}
                  />
                  <DeleteGoalButton goalId={g.id} deleteAction={deleteGoal.bind(null, athlete.id)} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <AthleteAccessCard
          athleteId={athlete.id}
          hasAccess={!!athlete.userId}
          accessEmail={athlete.email}
        />
      </div>

      <AthleteEvolutionCard history={athlete.metricsHistory} />

      <MetricsHistoryCard
        history={athlete.metricsHistory}
        updateAction={updateAthleteMetrics.bind(null, athlete.id)}
        deleteAction={deleteAthleteMetrics.bind(null, athlete.id)}
      />

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
            <WorkoutListItem key={w.id} workout={w} athleteId={athlete.id} athleteVma={metrics?.vma} />
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
            <WorkoutListItem key={w.id} workout={w} athleteId={athlete.id} athleteVma={metrics?.vma} />
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

