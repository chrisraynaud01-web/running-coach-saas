"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { addDays, addWeeks, addMonths, addYears, startOfWeek, endOfWeek, format } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { formatMonthLabel } from "@/lib/format"

export type CalendarView = "day" | "week" | "month" | "year"

function shift(view: CalendarView, date: Date, dir: 1 | -1) {
  switch (view) {
    case "day":
      return addDays(date, dir)
    case "week":
      return addWeeks(date, dir)
    case "month":
      return addMonths(date, dir)
    case "year":
      return addYears(date, dir)
  }
}

function labelFor(view: CalendarView, date: Date) {
  switch (view) {
    case "day": {
      const label = format(date, "EEEE d MMMM yyyy", { locale: fr })
      return label.charAt(0).toUpperCase() + label.slice(1)
    }
    case "week": {
      const start = startOfWeek(date, { weekStartsOn: 1 })
      const end = endOfWeek(date, { weekStartsOn: 1 })
      return `${format(start, "d MMM", { locale: fr })} – ${format(end, "d MMM yyyy", { locale: fr })}`
    }
    case "month":
      return formatMonthLabel(date)
    case "year":
      return format(date, "yyyy")
  }
}

export function PeriodNav({
  date,
  view,
  basePath,
}: {
  date: Date
  view: CalendarView
  basePath: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function go(target: Date) {
    const params = new URLSearchParams(searchParams)
    params.set("date", format(target, "yyyy-MM-dd"))
    router.push(`${basePath}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="outline" size="icon" className="size-7" onClick={() => go(shift(view, date, -1))}>
        <ChevronLeft className="size-4" />
      </Button>
      <p className="min-w-40 text-center text-sm font-medium capitalize">{labelFor(view, date)}</p>
      <Button variant="outline" size="icon" className="size-7" onClick={() => go(shift(view, date, 1))}>
        <ChevronRight className="size-4" />
      </Button>
      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => go(new Date())}>
        Aujourd&apos;hui
      </Button>
    </div>
  )
}
