import { prisma } from "@/lib/prisma"
import { getCurrentAthlete } from "@/lib/current-athlete"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { JournalEntryDialog } from "@/components/athlete/journal-entry-dialog"
import { formatDateTime } from "@/lib/format"

function ScaleBadge({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
      {label} {value}/10
    </span>
  )
}

export default async function AthleteJournalPage() {
  const athlete = await getCurrentAthlete()

  const entries = await prisma.journalEntry.findMany({
    where: { athleteId: athlete.id },
    orderBy: { date: "desc" },
    take: 30,
    include: { workout: { select: { title: true } } },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Mon journal</h1>
          <p className="text-sm text-muted-foreground">
            Ressenti, fatigue, sommeil, stress — garde une trace pour toi et ton coach.
          </p>
        </div>
        <JournalEntryDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Historique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {entries.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune entrée pour l&apos;instant.</p>
          )}
          {entries.map((e) => (
            <div key={e.id} className="space-y-1.5 border-b pb-3 last:border-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {formatDateTime(e.date)}
                  {e.workout && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      · {e.workout.title}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <ScaleBadge label="RPE" value={e.rpe} />
                <ScaleBadge label="Fatigue" value={e.fatigue} />
                <ScaleBadge label="Sommeil" value={e.sleepQuality} />
                <ScaleBadge label="Stress" value={e.stress} />
                {e.sleepHours != null && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {e.sleepHours}h de sommeil
                  </span>
                )}
              </div>
              {e.comment && <p className="text-sm text-muted-foreground">{e.comment}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
