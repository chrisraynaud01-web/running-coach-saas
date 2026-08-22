"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AthleteFilterSelect({
  athletes,
}: {
  athletes: { id: string; firstName: string; lastName: string }[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const current = searchParams.get("athlete") ?? "all"

  return (
    <Select
      value={current}
      onValueChange={(value) => {
        const params = new URLSearchParams(searchParams)
        if (!value || value === "all") {
          params.delete("athlete")
        } else {
          params.set("athlete", value)
        }
        const query = params.toString()
        router.push(`/dashboard${query ? `?${query}` : ""}`)
      }}
    >
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
  )
}
