import { type LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type AlertPanelProps = {
  title: string
  icon: LucideIcon
  tone: "critical" | "warning"
  emptyLabel: string
  items: { primary: string; secondary: string }[]
}

const toneStyles = {
  critical: {
    badge: "bg-[--color-critical]/10 text-[--color-critical]",
    icon: "text-[--color-critical]",
  },
  warning: {
    badge: "bg-[--color-warning]/15 text-[color-mix(in_oklch,var(--color-warning)_70%,black)] dark:text-[--color-warning]",
    icon: "text-[--color-warning]",
  },
}

export function AlertPanel({
  title,
  icon: Icon,
  tone,
  emptyLabel,
  items,
}: AlertPanelProps) {
  const styles = toneStyles[tone]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <Icon className={cn("size-4", styles.icon)} />
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        <span
          className={cn(
            "ml-auto rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
            styles.badge
          )}
        >
          {items.length}
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          items.map((item) => (
            <div key={item.primary} className="border-b pb-2.5 last:border-0 last:pb-0">
              <p className="text-sm font-medium">{item.primary}</p>
              <p className="text-xs text-muted-foreground">{item.secondary}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
