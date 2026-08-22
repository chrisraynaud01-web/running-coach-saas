import { type LucideIcon, TrendingDown, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  icon: Icon,
  trendPct,
}: {
  label: string
  value: string
  icon: LucideIcon
  trendPct?: number
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 px-5 py-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className="text-2xl font-semibold tabular-nums tracking-tight">
            {value}
          </span>
          {trendPct !== undefined && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trendPct >= 0 ? "text-[--color-good]" : "text-[--color-critical]"
              )}
            >
              {trendPct >= 0 ? (
                <TrendingUp className="size-3.5" />
              ) : (
                <TrendingDown className="size-3.5" />
              )}
              {Math.abs(trendPct)}% vs semaine dernière
            </span>
          )}
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-4.5" />
        </div>
      </CardContent>
    </Card>
  )
}
