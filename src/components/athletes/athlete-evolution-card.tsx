"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatDate, formatPace } from "@/lib/format"
import { secondsToClock } from "@/lib/time"

export type MetricsPoint = {
  recordedAt: Date
  vma: number | null
  maxHeartRate: number | null
  restingHeartRate: number | null
  pace5k: number | null
  pace10k: number | null
  paceHalfMarathon: number | null
  paceMarathon: number | null
  weightKg: number | null
}

type MetricKey = "vma" | "pace5k" | "pace10k" | "paceHalfMarathon" | "paceMarathon" | "weightKg" | "maxHeartRate" | "restingHeartRate"

const METRIC_OPTIONS: { key: MetricKey; label: string; unit: string; isPace: boolean }[] = [
  { key: "vma", label: "VMA", unit: "km/h", isPace: false },
  { key: "pace5k", label: "Allure 5 km", unit: "/km", isPace: true },
  { key: "pace10k", label: "Allure 10 km", unit: "/km", isPace: true },
  { key: "paceHalfMarathon", label: "Allure semi", unit: "/km", isPace: true },
  { key: "paceMarathon", label: "Allure marathon", unit: "/km", isPace: true },
  { key: "weightKg", label: "Poids", unit: "kg", isPace: false },
  { key: "maxHeartRate", label: "FC max", unit: "bpm", isPace: false },
  { key: "restingHeartRate", label: "FC repos", unit: "bpm", isPace: false },
]

const chartConfig = {
  value: {
    label: "Valeur",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function AthleteEvolutionCard({ history }: { history: MetricsPoint[] }) {
  const availableOptions = METRIC_OPTIONS.filter((o) => history.some((h) => h[o.key] != null))
  const [metric, setMetric] = React.useState<MetricKey | undefined>(availableOptions[0]?.key)

  const selected = METRIC_OPTIONS.find((o) => o.key === metric)

  const points = React.useMemo(() => {
    if (!selected) return []
    return history
      .filter((h) => h[selected.key] != null)
      .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime())
      .map((h) => ({
        date: formatDate(h.recordedAt),
        value: h[selected.key] as number,
      }))
  }, [history, selected])

  if (availableOptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Évolution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Pas encore assez de données sportives enregistrées pour afficher une évolution.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">Évolution</CardTitle>
        <Select value={metric} onValueChange={(v) => setMetric(v as MetricKey)}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue>
              {(value: string | null) => availableOptions.find((o) => o.key === value)?.label ?? ""}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableOptions.map((o) => (
              <SelectItem key={o.key} value={o.key}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {points.length < 2 ? (
          <p className="text-sm text-muted-foreground">
            Une seule mesure enregistrée pour {selected?.label.toLowerCase()}. Ajoute d&apos;autres
            relevés dans le temps pour voir la progression.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
            <LineChart data={points} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={selected?.isPace ? 44 : 36}
                domain={selected?.isPace ? ["dataMin - 10", "dataMax + 10"] : ["auto", "auto"]}
                reversed={selected?.isPace}
                tickFormatter={(v) => (selected?.isPace ? secondsToClock(v) : `${v}`)}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    formatter={(value) => (
                      <span className="font-medium tabular-nums">
                        {selected?.isPace ? formatPace(value as number) : `${value} ${selected?.unit}`}
                      </span>
                    )}
                  />
                }
              />
              <Line
                dataKey="value"
                type="monotone"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--chart-1)" }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
