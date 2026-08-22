import { CalendarDays } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function UpcomingEvents({
  events,
}: {
  events: { id: string; name: string; athlete: string; date: Date; type: string }[]
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <CalendarDays className="size-4 text-muted-foreground" />
        <CardTitle className="text-sm font-semibold">Évènements à venir</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aucune échéance à venir — renseigne une date d&apos;objectif sur une fiche athlète.
          </p>
        )}
        {events.map((event) => (
          <div key={event.id} className="flex items-center justify-between gap-3 border-b pb-2.5 last:border-0 last:pb-0">
            <div>
              <p className="text-sm font-medium">{event.name}</p>
              <p className="text-xs text-muted-foreground">
                {event.athlete} ·{" "}
                {new Date(event.date).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                })}
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0">
              {event.type}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
