"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { addMonths, format } from "date-fns"
import { Button } from "@/components/ui/button"
import { formatMonthLabel } from "@/lib/format"

export function MonthNav({ month, basePath }: { month: Date; basePath: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function go(target: Date) {
    const params = new URLSearchParams(searchParams)
    params.set("month", format(target, "yyyy-MM"))
    router.push(`${basePath}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" className="size-7" onClick={() => go(addMonths(month, -1))}>
        <ChevronLeft className="size-4" />
      </Button>
      <p className="w-32 text-center text-sm font-medium">{formatMonthLabel(month)}</p>
      <Button variant="outline" size="icon" className="size-7" onClick={() => go(addMonths(month, 1))}>
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
