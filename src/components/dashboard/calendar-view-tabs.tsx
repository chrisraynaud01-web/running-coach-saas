"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const VIEWS = [
  { value: "day", label: "Jour" },
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "year", label: "Année" },
] as const

export function CalendarViewTabs({ basePath }: { basePath: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get("view") ?? "month"

  return (
    <Tabs
      value={current}
      onValueChange={(value) => {
        const params = new URLSearchParams(searchParams)
        params.set("view", String(value))
        router.push(`${basePath}?${params.toString()}`)
      }}
    >
      <TabsList>
        {VIEWS.map((v) => (
          <TabsTrigger key={v.value} value={v.value}>
            {v.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
