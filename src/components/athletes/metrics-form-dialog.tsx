"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Pencil, Timer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { athleteMetricsSchema, type AthleteMetricsInput } from "@/lib/validations/metrics"
import { addAthleteMetrics } from "@/app/(app)/athletes/[id]/metrics-actions"
import { vmaFromDistanceAndTime } from "@/lib/time"

function emptyValues(): AthleteMetricsInput {
  return {
    vma: "",
    maxHeartRate: "",
    restingHeartRate: "",
    weightKg: "",
    time5k: "",
    time10k: "",
    timeHalfMarathon: "",
    timeMarathon: "",
  }
}

export function MetricsFormDialog({ athleteId }: { athleteId: string }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  // Calculateur test demi-Cooper : distance parcourue en un temps donné -> VMA estimée
  const [cooperDistance, setCooperDistance] = React.useState("")
  const [cooperTime, setCooperTime] = React.useState("6:00")

  const form = useForm({
    resolver: zodResolver(athleteMetricsSchema),
    defaultValues: emptyValues(),
  })

  React.useEffect(() => {
    if (open) {
      form.reset(emptyValues())
      setCooperDistance("")
      setCooperTime("6:00")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const cooperSeconds = React.useMemo(() => {
    const [m, s] = cooperTime.split(":").map(Number)
    if (Number.isNaN(m)) return undefined
    return m * 60 + (Number.isNaN(s) ? 0 : s)
  }, [cooperTime])

  const estimatedVma = React.useMemo(
    () => vmaFromDistanceAndTime(Number(cooperDistance) || undefined, cooperSeconds),
    [cooperDistance, cooperSeconds]
  )

  const onSubmit = form.handleSubmit(async (values) => {
    setPending(true)
    const result = await addAthleteMetrics(athleteId, values)
    setPending(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Données sportives mises à jour.")
    setOpen(false)
    router.refresh()
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label="Modifier les données sportives" />}
      >
        <Pencil className="size-3.5" />
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Données sportives</DialogTitle>
          <DialogDescription>
            Chaque enregistrement garde un historique pour suivre la progression de l&apos;athlète.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-5">
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
                    value={cooperDistance}
                    onChange={(e) => setCooperDistance(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Temps (mm:ss)</Label>
                  <Input
                    placeholder="6:00"
                    className="h-8 text-sm"
                    value={cooperTime}
                    onChange={(e) => setCooperTime(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!estimatedVma}
                  onClick={() => {
                    if (estimatedVma) form.setValue("vma", String(estimatedVma))
                  }}
                >
                  {estimatedVma ? `Utiliser ${estimatedVma} km/h` : "Utiliser"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="vma"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VMA (km/h)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="17.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxHeartRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FC Max</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="190" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="restingHeartRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FC Repos</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="weightKg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Poids (kg)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.1" placeholder="60" className="max-w-32" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="space-y-1">
              <p className="text-sm font-medium">Records de course</p>
              <p className="text-xs text-muted-foreground">
                Temps réalisé sur la distance (mm:ss ou h:mm:ss) — l&apos;allure est calculée automatiquement.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="time5k"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>5 km</FormLabel>
                    <FormControl>
                      <Input placeholder="19:30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time10k"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>10 km</FormLabel>
                    <FormControl>
                      <Input placeholder="40:30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timeHalfMarathon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semi-marathon</FormLabel>
                    <FormControl>
                      <Input placeholder="1:32:00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timeMarathon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marathon</FormLabel>
                    <FormControl>
                      <Input placeholder="3:20:00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
