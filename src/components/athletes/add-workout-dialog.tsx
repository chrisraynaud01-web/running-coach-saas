"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useFieldArray, useForm, useFormContext, useWatch, type Control } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Plus, X, GripVertical } from "lucide-react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

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
  workoutBlockTypeValues,
  workoutBlockTypeLabels,
  intensityValues,
  intensityLabels,
  type WorkoutInput,
} from "@/lib/validations/workout"
import { createWorkout, updateWorkout } from "@/app/(app)/athletes/[id]/actions"
import {
  paceFromVmaPercent,
  durationFromPaceAndDistance,
  secondsToClock,
  parseClockToSeconds,
  timeOfDayFromDate,
  TIME_OF_DAY_VALUES,
  timeOfDayLabels,
} from "@/lib/time"
import { cn } from "@/lib/utils"

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
    intensity: string | null
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
      durationSeconds: b.durationSeconds != null ? String(b.durationSeconds) : "",
      vmaPercent: b.vmaPercent != null ? String(b.vmaPercent) : "",
      // Si l'allure n'a pas été calculée depuis un % VMA, elle a été saisie directement par le coach.
      paceManual: !b.vmaPercent && b.paceTargetSecPerKm ? secondsToClock(b.paceTargetSecPerKm) : "",
      recoveryDuration: b.recoveryDurationSeconds ? secondsToClock(b.recoveryDurationSeconds) : "",
      recoveryBetweenSets: b.recoveryBetweenSetsSeconds ? secondsToClock(b.recoveryBetweenSetsSeconds) : "",
      intensity: (b.intensity ?? undefined) as WorkoutInput["blocks"][number]["intensity"],
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

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "blocks",
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id)
      const newIndex = fields.findIndex((f) => f.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) move(oldIndex, newIndex)
    }
  }

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

            <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Structure de la séance (optionnel)</p>
                  {athleteVma ? (
                    <p className="text-xs text-muted-foreground">
                      VMA actuelle de l&apos;athlète : {athleteVma} km/h — utilisable pour calculer
                      l&apos;allure des blocs en % VMA.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Renseigne la VMA de l&apos;athlète (fiche athlète) pour calculer
                      automatiquement l&apos;allure en % VMA.
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() =>
                    append({
                      type: fields.length === 0 ? "ECHAUFFEMENT" : "CORPS_DE_SEANCE",
                      label: "",
                      sets: "",
                      repetitions: "",
                      distanceMeters: "",
                      durationSeconds: "",
                      vmaPercent: "",
                      paceManual: "",
                      recoveryDuration: "",
                      recoveryBetweenSets: "",
                      intensity: undefined,
                    })
                  }
                >
                  <Plus className="size-3.5" />
                  Ajouter un bloc
                </Button>
              </div>

              {fields.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Aucun bloc. Ajoute un bloc par étape de la séance — échauffement, corps de
                  séance (ex : « 4 x 600m », avec récup entre répétitions et, si plusieurs
                  séries, récup entre séries), retour au calme.
                </p>
              )}

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={fields.map((f) => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {fields.map((field, index) => (
                    <SortableBlockRow
                      key={field.id}
                      id={field.id}
                      index={index}
                      control={form.control}
                      athleteVma={athleteVma}
                      onRemove={() => remove(index)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>

            <FormField
              control={form.control}
              name="coachNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consignes / notes générales</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Contexte, objectif de la séance..." {...field} />
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

function SortableBlockRow(
  props: {
    id: string
    index: number
    control: Control<WorkoutInput>
    athleteVma?: number | null
    onRemove: () => void
  }
) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <BlockRow {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

function BlockRow({
  index,
  control,
  athleteVma,
  onRemove,
  dragHandleProps,
}: {
  index: number
  control: Control<WorkoutInput>
  athleteVma?: number | null
  onRemove: () => void
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
}) {
  const { setValue } = useFormContext<WorkoutInput>()
  const vmaPercentValue = useWatch({ control, name: `blocks.${index}.vmaPercent` })
  const distanceValue = useWatch({ control, name: `blocks.${index}.distanceMeters` })
  const paceManualValue = useWatch({ control, name: `blocks.${index}.paceManual` })
  const repetitionsValue = useWatch({ control, name: `blocks.${index}.repetitions` })

  const paceFromVma =
    athleteVma && Number(vmaPercentValue) ? paceFromVmaPercent(athleteVma, Number(vmaPercentValue)) : undefined
  const pace = paceFromVma ?? parseClockToSeconds(paceManualValue)
  const computedDuration =
    pace && Number(distanceValue) ? durationFromPaceAndDistance(pace, Number(distanceValue)) : undefined
  const showRecovery = Number(repetitionsValue) > 1

  React.useEffect(() => {
    if (computedDuration) {
      setValue(`blocks.${index}.durationSeconds`, String(computedDuration))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computedDuration, index])

  return (
    <div className="space-y-2.5 rounded-md border bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="touch-none cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
            aria-label="Réordonner le bloc"
            {...dragHandleProps}
          >
            <GripVertical className="size-4" />
          </button>
          <FormField
            control={control}
            name={`blocks.${index}.type`}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="h-8 w-48 text-xs">
                  <SelectValue>
                    {(value: string | null) =>
                      value ? workoutBlockTypeLabels[value as (typeof workoutBlockTypeValues)[number]] : ""
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {workoutBlockTypeValues.map((t) => (
                    <SelectItem key={t} value={t}>
                      {workoutBlockTypeLabels[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground"
          onClick={onRemove}
        >
          <X className="size-4" />
        </Button>
      </div>

      <FormField
        control={control}
        name={`blocks.${index}.label`}
        render={({ field }) => (
          <Input
            placeholder="Description libre, ex : 10 x 400m à VMA"
            className="h-8 text-sm"
            {...field}
          />
        )}
      />

      <div className="grid grid-cols-3 gap-2">
        <FormField
          control={control}
          name={`blocks.${index}.repetitions`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">Répétitions</FormLabel>
              <FormControl>
                <Input type="number" placeholder="10" className="h-8 text-sm" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`blocks.${index}.distanceMeters`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">Distance (m)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="400" className="h-8 text-sm" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        {computedDuration ? (
          <FormItem>
            <FormLabel className="text-xs text-muted-foreground">Durée (auto)</FormLabel>
            <p className="flex h-8 items-center text-sm font-medium">{secondsToClock(computedDuration)}</p>
          </FormItem>
        ) : (
          <FormField
            control={control}
            name={`blocks.${index}.durationSeconds`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">Durée (sec)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="90" className="h-8 text-sm" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <FormField
          control={control}
          name={`blocks.${index}.vmaPercent`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-muted-foreground">Allure en % VMA</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="100"
                  className="h-8 w-24 text-sm"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />
        {!paceFromVma && (
          <FormField
            control={control}
            name={`blocks.${index}.paceManual`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">ou allure directe</FormLabel>
                <FormControl>
                  <Input placeholder="3:55/km" className="h-8 w-24 text-sm" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
        <p className={cn("pb-2 text-xs text-muted-foreground", pace && "text-foreground")}>
          {pace ? `≈ ${secondsToClock(pace)}/km` : "—"}
        </p>

        <FormField
          control={control}
          name={`blocks.${index}.intensity`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormLabel className="text-xs text-muted-foreground">Intensité</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue placeholder="—">
                      {(value: string | null) =>
                        value ? intensityLabels[value as (typeof intensityValues)[number]] : "—"
                      }
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {intensityValues.map((i) => (
                    <SelectItem key={i} value={i}>
                      {intensityLabels[i]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>

      {showRecovery && (
        <div className="flex flex-wrap items-end gap-3 rounded-md border border-dashed p-2">
          <FormField
            control={control}
            name={`blocks.${index}.recoveryDuration`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">
                  Récup entre répétitions (r:)
                </FormLabel>
                <FormControl>
                  <Input placeholder="1:15" className="h-8 w-20 text-sm" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`blocks.${index}.sets`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">Séries</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="1" className="h-8 w-16 text-sm" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`blocks.${index}.recoveryBetweenSets`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">
                  Récup entre séries (R:)
                </FormLabel>
                <FormControl>
                  <Input placeholder="3:00" className="h-8 w-20 text-sm" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <p className="pb-2 text-xs text-muted-foreground">
            Ex : 2 x (4 x 600m, récup 1&apos;15) avec 3&apos; entre les séries
          </p>
        </div>
      )}
    </div>
  )
}
