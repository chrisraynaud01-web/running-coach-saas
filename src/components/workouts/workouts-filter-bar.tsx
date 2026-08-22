"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PERIODS = [
  { value: "upcoming", label: "À venir" },
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois-ci" },
  { value: "all", label: "Toutes" },
] as const

export function WorkoutsFilterBar({
  athletes,
}: {
  athletes: { id: string; firstName: string; lastName: string }[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const athleteValue = searchParams.get("athlete") ?? "all"
  const periodValue = searchParams.get("period") ?? "upcoming"

  function updateParam(key: string, value: string | null) {
    if (!value) return
    const params = new URLSearchParams(searchParams)
    if (value === "all" && key === "athlete") {
      params.delete("athlete")
    } else {
      params.set(key, value)
    }
    const query = params.toString()
    router.push(`/workouts${query ? `?${query}` : ""}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={athleteValue} onValueChange={(v) => updateParam("athlete", v)}>
        <SelectTrigger className="h-8 w-52 text-sm">
          <SelectValue placeholder="Tous les athlètes">
            {(value: string | null) => {
              const athlete = athletes.find((a) => a.id === value)
              return athlete ? `${athlete.firstName} ${athlete.lastName}` : "Tous les athlètes"
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les athlètes</SelectItem>
          {athletes.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.firstName} {a.lastName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={periodValue} onValueChange={(v) => updateParam("period", v)}>
        <SelectTrigger className="h-8 w-44 text-sm">
          <SelectValue>
            {(value: string | null) => PERIODS.find((p) => p.value === value)?.label ?? "À venir"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {PERIODS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
