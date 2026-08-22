import { Badge } from "@/components/ui/badge"

const labels: Record<string, string> = {
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
  ARCHIVED: "Archivé",
}

const variants: Record<string, "default" | "secondary" | "outline"> = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  ARCHIVED: "outline",
}

export function AthleteStatusBadge({ status }: { status: string }) {
  return <Badge variant={variants[status] ?? "secondary"}>{labels[status] ?? status}</Badge>
}
