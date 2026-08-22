"use client"

import * as React from "react"
import { Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { vmaFromDistanceAndTime } from "@/lib/time"

export function CooperCalculator({ onApply }: { onApply: (vma: number) => void }) {
  const [distance, setDistance] = React.useState("")
  const [time, setTime] = React.useState("6:00")

  const seconds = React.useMemo(() => {
    const [m, s] = time.split(":").map(Number)
    if (Number.isNaN(m)) return undefined
    return m * 60 + (Number.isNaN(s) ? 0 : s)
  }, [time])

  const estimatedVma = React.useMemo(
    () => vmaFromDistanceAndTime(Number(distance) || undefined, seconds),
    [distance, seconds]
  )

  return (
    <div className="space-y-2.5 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Timer className="size-4" />
        Test demi-Cooper (estimation VMA)
      </div>
      <p className="text-xs text-muted-foreground">
        Distance parcourue par l&apos;athlète pendant le temps du test (6 minutes par défaut).
      </p>
      <div className="grid grid-cols-3 items-end gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Distance (m)</Label>
          <Input
            type="number"
            placeholder="1400"
            className="h-8 text-sm"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Temps (mm:ss)</Label>
          <Input
            placeholder="6:00"
            className="h-8 text-sm"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!estimatedVma}
          onClick={() => estimatedVma && onApply(estimatedVma)}
        >
          {estimatedVma ? `Utiliser ${estimatedVma} km/h` : "Utiliser"}
        </Button>
      </div>
    </div>
  )
}
