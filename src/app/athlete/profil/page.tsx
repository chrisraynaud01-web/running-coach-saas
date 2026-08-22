import { Target } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { getCurrentAthlete } from "@/lib/current-athlete"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatPace } from "@/lib/format"

export default async function AthleteProfilePage() {
  const athlete = await getCurrentAthlete()

  const [metrics, goals] = await Promise.all([
    prisma.athleteMetrics.findFirst({
      where: { athleteId: athlete.id },
      orderBy: { recordedAt: "desc" },
    }),
    prisma.goal.findMany({
      where: { athleteId: athlete.id },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const primaryGoal = goals.find((g) => g.isPrimary) ?? goals[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Mon profil</h1>
        <p className="text-sm text-muted-foreground">
          Tes données sportives, telles que renseignées par ton coach.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Données sportives</CardTitle>
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
              <p className="text-sm text-muted-foreground">Aucun objectif défini pour l&apos;instant.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Historique des objectifs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {goals.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun historique.</p>
          )}
          {goals.map((g) => (
            <div key={g.id} className="flex items-center justify-between text-sm">
              <span className="truncate">{g.title}</span>
              <Badge variant="outline" className="shrink-0 text-xs">
                {g.status === "ACTIVE" ? "En cours" : g.status === "ACHIEVED" ? "Atteint" : "Abandonné"}
              </Badge>
            </div>
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
