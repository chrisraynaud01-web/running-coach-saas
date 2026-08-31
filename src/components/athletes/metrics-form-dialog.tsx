"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Pencil, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { CooperCalculator } from "@/components/athletes/cooper-calculator"
import { secondsToClock } from "@/lib/time"

const HALF_MARATHON_KM = 21.0975
const MARATHON_KM = 42.195

export type AthleteMetricsRecord = {
  id: string
  vma: number | null
  maxHeartRate: number | null
  restingHeartRate: number | null
  weightKg: number | null
  pace5k: number | null
  pace10k: number | null
  paceHalfMarathon: number | null
  paceMarathon: number | null
}

function timeFromPace(pace: number | null, distanceKm: number): string {
  return pace ? secondsToClock(Math.round(pace * distanceKm)) : ""
}

function defaultValuesFor(metrics?: AthleteMetricsRecord): AthleteMetricsInput {
  if (!metrics) {
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
  return {
    vma: metrics.vma != null ? String(metrics.vma) : "",
    maxHeartRate: metrics.maxHeartRate != null ? String(metrics.maxHeartRate) : "",
    restingHeartRate: metrics.restingHeartRate != null ? String(metrics.restingHeartRate) : "",
    weightKg: metrics.weightKg != null ? String(metrics.weightKg) : "",
    time5k: timeFromPace(metrics.pace5k, 5),
    time10k: timeFromPace(metrics.pace10k, 10),
    timeHalfMarathon: timeFromPace(metrics.paceHalfMarathon, HALF_MARATHON_KM),
    timeMarathon: timeFromPace(metrics.paceMarathon, MARATHON_KM),
  }
}

type ActionResult = { success: true } | { success: false; error: string }

export function MetricsFormDialog({
  metrics,
  action,
  updateAction,
}: {
  /** Présent en mode édition d'un relevé existant. */
  metrics?: AthleteMetricsRecord
  /** Création d'un nouveau relevé. */
  action?: (values: AthleteMetricsInput) => Promise<ActionResult>
  /** Modification d'un relevé existant (fourni avec `metrics`). */
  updateAction?: (metricsId: string, values: AthleteMetricsInput) => Promise<ActionResult>
}) {
  const isEdit = !!metrics
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  const form = useForm({
    resolver: zodResolver(athleteMetricsSchema),
    defaultValues: defaultValuesFor(metrics),
  })

  React.useEffect(() => {
    if (open) form.reset(defaultValuesFor(metrics))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const onSubmit = form.handleSubmit(async (values) => {
    setPending(true)
    const result =
      isEdit && metrics && updateAction ? await updateAction(metrics.id, values) : action ? await action(values) : undefined
    setPending(false)

    if (!result) return
    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success(isEdit ? "Relevé mis à jour." : "Données sportives mises à jour.")
    setOpen(false)
    router.refresh()
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon-sm" aria-label="Modifier ce relevé" />
          ) : (
            <Button variant="ghost" size="icon-sm" aria-label="Ajouter un relevé" />
          )
        }
      >
        {isEdit ? <Pencil className="size-3.5" /> : <Plus className="size-3.5" />}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier ce relevé" : "Données sportives"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Corrige les valeurs de ce relevé daté."
              : "Chaque enregistrement garde un historique pour suivre la progression de l'athlète."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-5">
            <CooperCalculator onApply={(vma) => form.setValue("vma", String(vma))} />

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
                {pending ? "Enregistrement..." : isEdit ? "Enregistrer" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
