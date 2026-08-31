"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { workoutResultSchema } from "@/lib/validations/workout-result"
import { submitWorkoutResult } from "@/app/athlete/actions"
import { workoutBlockTypeLabels } from "@/lib/validations/workout"
import { formatBlockSummary, totalReps } from "@/lib/workout-summary"
import { secondsToClock } from "@/lib/time"

export type ResultBlock = {
  id: string
  type: string
  label: string | null
  sets: number | null
  repetitions: number | null
  distanceMeters: number | null
  vmaPercent: number | null
  paceTargetSecPerKm: number | null
  recoveryDurationSeconds: number | null
  recoveryBetweenSetsSeconds: number | null
  actualDurationSeconds?: number | null
  actualRepSecondsList?: number[]
  actualNotes?: string | null
  legs?: {
    distanceMeters: number | null
    vmaPercent: number | null
    paceTargetSecPerKm: number | null
    recoveryAfterSeconds: number | null
  }[]
}

// Pour un bloc à portions enchaînées, chaque case du grille de saisie correspond à un
// (tour, portion) précis plutôt qu'à une répétition uniforme — ex : "T1 · 200m".
function repLabel(block: ResultBlock, repIndex: number): string {
  const legsCount = block.legs?.length ?? 0
  if (legsCount === 0) return `Rep ${repIndex + 1}`
  const tour = Math.floor(repIndex / legsCount) + 1
  const leg = block.legs![repIndex % legsCount]
  return `T${tour} · ${leg.distanceMeters ?? "?"}m`
}

export function WorkoutResultDialog({
  workoutId,
  blocks,
  currentRpe,
  isEdit = false,
}: {
  workoutId: string
  blocks: ResultBlock[]
  /** RPE déjà enregistré pour cette séance (via une précédente soumission), pour pré-remplir. */
  currentRpe?: number | null
  isEdit?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  const form = useForm({
    resolver: zodResolver(workoutResultSchema),
    defaultValues: {
      workoutId,
      rpe: currentRpe ? String(currentRpe) : "",
      blocks: blocks.map((b) => {
        const reps = totalReps(b)
        const repSeconds = b.actualRepSecondsList ?? []
        return {
          blockId: b.id,
          actualDuration: reps <= 1 && b.actualDurationSeconds ? secondsToClock(b.actualDurationSeconds) : "",
          actualNotes: b.actualNotes ?? "",
          actualReps: Array.from({ length: reps }, (_, i) => (repSeconds[i] > 0 ? secondsToClock(repSeconds[i]) : "")),
        }
      }),
    },
  })

  const { fields } = useFieldArray({ control: form.control, name: "blocks" })

  const onSubmit = form.handleSubmit(async (values) => {
    setPending(true)
    const result = await submitWorkoutResult(values)
    setPending(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success(isEdit ? "Résultat mis à jour." : "Résultat enregistré, séance marquée comme réalisée.")
    setOpen(false)
    router.refresh()
  })

  const hasBlocks = blocks.length > 0
  const triggerLabel = isEdit
    ? hasBlocks ? "Modifier mon résultat" : "Modifier ma séance"
    : hasBlocks ? "Enregistrer mon résultat" : "Marquer comme réalisée"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant={isEdit ? "outline" : "default"} />}>
        <CheckCircle2 className="size-4" />
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Mon résultat</DialogTitle>
          <DialogDescription>
            {hasBlocks
              ? "Indique le temps réalisé pour chaque répétition — la séance sera marquée comme réalisée."
              : "Note la difficulté ressentie — la séance sera marquée comme réalisée."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="rpe"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">
                    Difficulté ressentie (RPE) — {field.value || "—"}/10
                  </FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => field.onChange(String(n))}
                          className={`flex size-8 items-center justify-center rounded-md border text-sm transition-colors ${
                            String(n) === field.value
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input bg-transparent hover:bg-muted"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {fields.map((field, index) => {
              const block = blocks[index]
              const reps = totalReps(block)
              const summary = formatBlockSummary(block)
              return (
                <div key={field.id} className="space-y-2 rounded-md border p-3">
                  <p className="text-sm font-medium">
                    {workoutBlockTypeLabels[block.type as keyof typeof workoutBlockTypeLabels] ?? block.type}
                    {summary ? ` — ${summary}` : ""}
                  </p>

                  {reps > 1 ? (
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                      {Array.from({ length: reps }, (_, repIndex) => (
                        <FormField
                          key={repIndex}
                          control={form.control}
                          name={`blocks.${index}.actualReps.${repIndex}`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground">
                                {repLabel(block, repIndex)}
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="mm:ss" className="h-8 text-sm" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name={`blocks.${index}.actualDuration`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">Temps réalisé</FormLabel>
                            <FormControl>
                              <Input placeholder="mm:ss" className="h-8 text-sm" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name={`blocks.${index}.actualNotes`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ressenti, conditions..."
                            className="min-h-16 text-sm"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )
            })}

            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Envoi..." : "Enregistrer et marquer réalisée"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
