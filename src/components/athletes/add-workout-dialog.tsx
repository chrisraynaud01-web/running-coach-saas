"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Plus } from "lucide-react"

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  workoutSchema,
  workoutTypeValues,
  workoutTypeLabels,
  freeformWorkoutTypes,
  type WorkoutInput,
} from "@/lib/validations/workout"
import { createWorkout, updateWorkout } from "@/app/(app)/athletes/[id]/actions"
import { secondsToClock, timeOfDayFromDate, TIME_OF_DAY_VALUES, timeOfDayLabels } from "@/lib/time"
import { WorkoutBlocksEditor } from "@/components/athletes/workout-blocks-editor"

export type WorkoutRecord = {
  id: string
  title: string
  type: string
  scheduledDate: Date | string
  plannedDistanceMeters: number | null
  plannedDurationSeconds: number | null
  coachNotes: string | null
  blocks: {
    type: string
    label: string | null
    sets: number | null
    repetitions: number | null
    distanceMeters: number | null
    durationSeconds: number | null
    vmaPercent: number | null
    paceTargetSecPerKm: number | null
    recoveryDurationSeconds: number | null
    recoveryBetweenSetsSeconds: number | null
    targetRpe: number | null
    legs: {
      distanceMeters: number | null
      durationSeconds: number | null
      vmaPercent: number | null
      paceTargetSecPerKm: number | null
      recoveryAfterSeconds: number | null
    }[]
  }[]
}

function toDateInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function defaultValuesFor(athleteId: string, workout?: WorkoutRecord): WorkoutInput {
  if (!workout) {
    return {
      athleteId,
      title: "",
      type: "ENDURANCE_FONDAMENTALE",
      scheduledDate: toDateInputValue(new Date()),
      timeOfDay: "MORNING",
      coachNotes: "",
      blocks: [],
    }
  }

  const scheduled = new Date(workout.scheduledDate)

  return {
    athleteId,
    title: workout.title,
    type: workout.type as WorkoutInput["type"],
    scheduledDate: toDateInputValue(scheduled),
    timeOfDay: timeOfDayFromDate(scheduled),
    coachNotes: workout.coachNotes ?? "",
    blocks: workout.blocks.map((b) => ({
      type: b.type as WorkoutInput["blocks"][number]["type"],
      label: b.label ?? "",
      sets: b.sets != null ? String(b.sets) : "",
      repetitions: b.repetitions != null ? String(b.repetitions) : "",
      distanceMeters: b.distanceMeters != null ? String(b.distanceMeters) : "",
      // Si la durée n'a pas pu être déduite d'une allure (pas de distance/pace), elle a été saisie
      // directement par le coach (ex : 20 min d'échauffement).
      durationManual: !b.paceTargetSecPerKm && b.durationSeconds ? secondsToClock(b.durationSeconds) : "",
      vmaPercent: b.vmaPercent != null ? String(b.vmaPercent) : "",
      // Si l'allure n'a pas été calculée depuis un % VMA, elle a été saisie directement par le coach.
      paceManual: b.paceTargetSecPerKm ? secondsToClock(b.paceTargetSecPerKm) : "",
      recoveryDuration: b.recoveryDurationSeconds ? secondsToClock(b.recoveryDurationSeconds) : "",
      recoveryBetweenSets: b.recoveryBetweenSetsSeconds ? secondsToClock(b.recoveryBetweenSetsSeconds) : "",
      targetRpe: b.targetRpe != null ? String(b.targetRpe) : "",
      legs: b.legs.map((leg) => ({
        distanceMeters: leg.distanceMeters != null ? String(leg.distanceMeters) : "",
        durationManual: !leg.paceTargetSecPerKm && leg.durationSeconds ? secondsToClock(leg.durationSeconds) : "",
        vmaPercent: leg.vmaPercent != null ? String(leg.vmaPercent) : "",
        paceManual: leg.paceTargetSecPerKm ? secondsToClock(leg.paceTargetSecPerKm) : "",
        recoveryAfter: leg.recoveryAfterSeconds ? secondsToClock(leg.recoveryAfterSeconds) : "",
      })),
    })),
  }
}

type Props = {
  athleteId: string
  athleteVma?: number | null
  workout?: WorkoutRecord
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function WorkoutFormDialog({
  athleteId,
  athleteVma,
  workout,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: Props) {
  const isEdit = !!workout
  const isControlled = openProp !== undefined
  const router = useRouter()
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  const open = isControlled ? openProp : internalOpen
  const setOpen = isControlled ? onOpenChangeProp! : setInternalOpen

  const form = useForm({
    resolver: zodResolver(workoutSchema),
    defaultValues: defaultValuesFor(athleteId, workout),
  })
  const watchedType = form.watch("type")
  const isFreeform = freeformWorkoutTypes.includes(watchedType as (typeof workoutTypeValues)[number])

  React.useEffect(() => {
    if (open) form.reset(defaultValuesFor(athleteId, workout))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const onSubmit = form.handleSubmit(async (values) => {
    setPending(true)
    const result = isEdit ? await updateWorkout(workout.id, values) : await createWorkout(values)
    setPending(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success(isEdit ? "Séance mise à jour." : "Séance ajoutée.")
    setOpen(false)
    router.refresh()
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger render={<Button size="sm" />}>
          <Plus className="size-4" />
          Ajouter une séance
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la séance" : "Nouvelle séance"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Mets à jour le titre, la date ou la structure de la séance."
              : "Planifie une séance pour cet athlète. Ajoute des blocs (échauffement, corps de séance, retour au calme) pour un format libre — par exemple 2 x (4 x 600m à VMA, récup 1'15) avec 3' entre les séries. La distance et la durée totales sont calculées automatiquement à partir des blocs."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex : 10 x 400m à VMA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {(value: string | null) =>
                              value ? workoutTypeLabels[value as (typeof workoutTypeValues)[number]] : ""
                            }
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workoutTypeValues.map((t) => (
                          <SelectItem key={t} value={t}>
                            {workoutTypeLabels[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timeOfDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Créneau</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {(value: string | null) =>
                              value ? timeOfDayLabels[value as (typeof TIME_OF_DAY_VALUES)[number]] : ""
                            }
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIME_OF_DAY_VALUES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {timeOfDayLabels[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <WorkoutBlocksEditor control={form.control} athleteVma={athleteVma} />

            <FormField
              control={form.control}
              name="coachNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isFreeform ? "Contenu de la séance" : "Consignes / notes générales"}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        isFreeform
                          ? "Exercices, séries, répétitions, charges..."
                          : "Contexte, objectif de la séance..."
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Enregistrement..." : isEdit ? "Enregistrer" : "Ajouter la séance"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
