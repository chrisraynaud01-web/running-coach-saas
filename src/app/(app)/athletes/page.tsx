import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { getCurrentCoach } from "@/lib/current-coach"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { AthleteFormDialog } from "@/components/athletes/athlete-form-dialog"
import { AthleteStatusBadge } from "@/components/athletes/athlete-status-badge"
import { AthleteActionsMenu } from "@/components/athletes/athlete-actions-menu"

export default async function AthletesPage() {
  const coach = await getCurrentCoach()

  const athletes = await prisma.athlete.findMany({
    where: { coachId: coach.id },
    orderBy: { createdAt: "desc" },
    include: {
      goals: { where: { isPrimary: true }, take: 1 },
      _count: { select: { workouts: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Athlètes</h1>
          <p className="text-sm text-muted-foreground">
            {athletes.length} athlète{athletes.length > 1 ? "s" : ""} dans ton groupe.
          </p>
        </div>
        <AthleteFormDialog />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Athlète</TableHead>
                <TableHead>Objectif principal</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Séances</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {athletes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                    Aucun athlète pour le moment. Clique sur « Nouvel athlète » pour commencer.
                  </TableCell>
                </TableRow>
              )}
              {athletes.map((athlete) => (
                <TableRow key={athlete.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/athletes/${athlete.id}`} className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs">
                          {athlete.firstName[0]}
                          {athlete.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {athlete.firstName} {athlete.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{athlete.email}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {athlete.goals[0]?.title ?? "—"}
                  </TableCell>
                  <TableCell>
                    <AthleteStatusBadge status={athlete.status} />
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {athlete._count.workouts}
                  </TableCell>
                  <TableCell>
                    <AthleteActionsMenu athlete={athlete} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
