import { CheckCircle2 } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { getCurrentAthlete } from "@/lib/current-athlete"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { JournalEntryDialog } from "@/components/athlete/journal-entry-dialog"
import { MarkCompleteButton } from "@/components/athlete/mark-complete-button"
import { WorkoutResultDialog } from "@/components/athlete/workout-result-dialog"
import { workoutTypeLabels, workoutBlockTypeLabels } from "@/lib/validations/workout"
import { formatWorkoutSchedule, formatDistance, formatDuration } from "@/lib/format"

export default async function AthletePlanningPage() {
  const athlete = await getCurrentAthlete()

  const workouts = await prisma.workout.findMany({
    where: { athleteId: athlete.id },
    orderBy: { scheduledDate: "desc" },
    take: 20,
    include: { blocks: { orderBy: { order: "asc" } } },
  })

  const upcoming = workouts.filter((w) => w.status === "PLANNED")
  const past = workouts.filter((w) => w.status !== "PLANNED")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Mon planning</h1>
        <p className="text-sm text-muted-foreground">
          Bonjour {athlete.firstName}, voici tes prochaines séances.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Séances à venir ({upcoming.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {upcoming.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune séance planifiée pour l&apos;instant.</p>
          )}
          {upcoming.map((w) => (
            <div key={w.id} className="flex items-start justify-between gap-3 border-b py-2.5 last:border-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{w.title}</p>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {workoutTypeLabels[w.type as keyof typeof workoutTypeLabels] ?? w.type}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatWorkoutSchedule(w.scheduledDate)} · {formatDistance(w.plannedDistanceMeters)} ·{" "}
                  {formatDuration(w.plannedDurationSeconds)}
                </p>
                {w.blocks.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {w.blocks.map((b) => (
                      <li key={b.id} className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">
                          {workoutBlockTypeLabels[b.type as keyof typeof workoutBlockTypeLabels] ?? b.type}
                        </span>
                        {" — "}
                        {b.label ||
                          [
                            b.repetitions && `${b.repetitions}x`,
                            b.distanceMeters && `${b.distanceMeters}m`,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        {b.recoveryDurationSeconds ? ` · récup ${b.recoveryDurationSeconds}s` : ""}
                        {b.vmaPercent ? ` · ${b.vmaPercent}% VMA` : ""}
                      </li>
                    ))}
                  </ul>
                )}
                {w.coachNotes && (
                  <p className="mt-1.5 rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                    {w.coachNotes}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {w.blocks.length > 0 ? (
                  <WorkoutResultDialog workoutId={w.id} blocks={w.blocks} />
                ) : (
                  <MarkCompleteButton workoutId={w.id} />
                )}
                <JournalEntryDialog workoutId={w.id} workoutTitle={w.title} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Historique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {past.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune séance enregistrée pour l&apos;instant.</p>
          )}
          {past.map((w) => (
            <div key={w.id} className="flex items-start justify-between gap-3 border-b py-2.5 last:border-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{w.title}</p>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {workoutTypeLabels[w.type as keyof typeof workoutTypeLabels] ?? w.type}
                  </Badge>
                  {w.status === "COMPLETED" && (
                    <Badge className="shrink-0 bg-[--color-good]/15 text-[--color-good] text-xs" variant="outline">
                      <CheckCircle2 className="size-3" />
                      Réalisée
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatWorkoutSchedule(w.scheduledDate)} · {formatDistance(w.plannedDistanceMeters)} ·{" "}
                  {formatDuration(w.plannedDurationSeconds)}
                </p>
                {w.blocks.some((b) => b.actualDurationSeconds || b.actualNotes) && (
                  <ul className="mt-1.5 space-y-0.5">
                    {w.blocks
                      .filter((b) => b.actualDurationSeconds || b.actualNotes)
                      .map((b) => (
                        <li key={b.id} className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground/80">
                            {workoutBlockTypeLabels[b.type as keyof typeof workoutBlockTypeLabels] ?? b.type}
                          </span>
                          {b.actualDurationSeconds ? ` — réalisé en ${formatDuration(b.actualDurationSeconds)}` : ""}
                          {b.actualNotes ? ` (${b.actualNotes})` : ""}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
              <JournalEntryDialog workoutId={w.id} workoutTitle={w.title} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
