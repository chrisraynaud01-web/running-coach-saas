"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartConfig = {
  value: {
    label: "Séances",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function WorkoutTypeChart({
  data,
}: {
  data: { type: string; value: number }[]
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Aucune séance sur les 8 dernières semaines.
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 0, right: 16 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis
          dataKey="type"
          type="category"
          tickLine={false}
          axisLine={false}
          width={140}
          tick={{ fontSize: 11 }}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="value" fill="var(--chart-2)" radius={4} barSize={16} />
      </BarChart>
    </ChartContainer>
  )
}
