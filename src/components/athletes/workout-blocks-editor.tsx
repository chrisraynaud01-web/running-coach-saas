"use client"

import * as React from "react"
import { useFieldArray, useFormContext, useWatch } from "react-hook-form"
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
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  workoutBlockTypeValues,
  workoutBlockTypeLabels,
  intensityValues,
  intensityLabels,
  continuousWorkoutTypes,
  workoutTypeValues,
} from "@/lib/validations/workout"
import {
  paceFromVmaPercent,
  vmaPercentFromPace,
  durationFromPaceAndDistance,
  secondsToClock,
  parseClockToSeconds,
} from "@/lib/time"

// Champ "blocks" partagé entre le formulaire séance mono-athlète et le formulaire multi-athlètes —
// non typé strictement sur WorkoutInput pour rester réutilisable entre les deux schémas.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyControl = any

function emptyBlock(type: (typeof workoutBlockTypeValues)[number]) {
  return {
    type,
    label: "",
    sets: "",
    repetitions: "",
    distanceMeters: "",
    durationManual: "",
    vmaPercent: "",
    paceManual: "",
    recoveryDuration: "",
    recoveryBetweenSets: "",
    intensity: undefined,
  }
}

export function WorkoutBlocksEditor({
  control,
  athleteVma,
  athleteVmaNote,
  bulk = false,
}: {
  control: AnyControl
  athleteVma?: number | null
  athleteVmaNote?: string
  /** true quand la séance est créée pour plusieurs athlètes à la fois : la VMA de chacun
   *  n'est connue qu'au moment de l'enregistrement, donc le % VMA reste saisissable même
   *  sans aperçu d'allure immédiat. */
  bulk?: boolean
}) {
  const { fields, append, remove, move } = useFieldArray({ control, name: "blocks" })
  const workoutType = useWatch({ control, name: "type" })
  const isContinuous = continuousWorkoutTypes.includes(workoutType as (typeof workoutTypeValues)[number])

  // Une séance en effort continu (endurance fondamentale, sortie longue, récupération) démarre
  // avec un unique bloc "durée + allure" — pas de distance/séries à préciser pour ce type d'effort.
  // Le ref évite un double ajout au montage (double-invocation des effets en dev/StrictMode).
  const lastSeededTypeRef = React.useRef<string | undefined>(undefined)
  React.useEffect(() => {
    if (lastSeededTypeRef.current === workoutType) return
    lastSeededTypeRef.current = workoutType
    if (isContinuous && fields.length === 0) {
      append(emptyBlock("CORPS_DE_SEANCE"))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutType])

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

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Structure de la séance (optionnel)</p>
          {athleteVmaNote ? (
            <p className="text-xs text-muted-foreground">{athleteVmaNote}</p>
          ) : athleteVma ? (
            <p className="text-xs text-muted-foreground">
              VMA actuelle de l&apos;athlète : {athleteVma} km/h — utilisable pour calculer
              l&apos;allure des blocs en % VMA.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Renseigne la VMA de l&apos;athlète (fiche athlète) pour calculer automatiquement
              l&apos;allure en % VMA.
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() =>
            append(emptyBlock(fields.length === 0 ? "ECHAUFFEMENT" : "CORPS_DE_SEANCE"))
          }
        >
          <Plus className="size-3.5" />
          Ajouter un bloc
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Aucun bloc. Ajoute un bloc par étape de la séance — échauffement, corps de séance (ex :
          « 4 x 600m », avec récup entre répétitions et, si plusieurs séries, récup entre
          séries), retour au calme.
        </p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          {fields.map((field, index) => (
            <SortableBlockRow
              key={field.id}
              id={field.id}
              index={index}
              control={control}
              athleteVma={athleteVma}
              bulk={bulk}
              isContinuous={isContinuous}
              onRemove={() => remove(index)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}

function SortableBlockRow(props: {
  id: string
  index: number
  control: AnyControl
  athleteVma?: number | null
  bulk?: boolean
  isContinuous?: boolean
  onRemove: () => void
}) {
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
  bulk,
  isContinuous,
  onRemove,
  dragHandleProps,
}: {
  index: number
  control: AnyControl
  athleteVma?: number | null
  bulk?: boolean
  isContinuous?: boolean
  onRemove: () => void
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
}) {
  const { setValue } = useFormContext()
  const blockType = useWatch({ control, name: `blocks.${index}.type` })
  const isRestBlock = blockType === "REPOS"
  // Un bloc "repos" ou une séance en effort continu n'a pas de séries/répétitions/distance à
  // préciser : uniquement une durée (et, hors repos, une allure).
  const isSimplified = isContinuous || isRestBlock
  const distanceValue = useWatch({ control, name: `blocks.${index}.distanceMeters` })
  const repetitionsValue = useWatch({ control, name: `blocks.${index}.repetitions` })
  const setsValue = useWatch({ control, name: `blocks.${index}.sets` })

  const pace = useWatch({ control, name: `blocks.${index}.paceManual` })
  const paceSeconds = parseClockToSeconds(pace)
  const computedDuration =
    paceSeconds && Number(distanceValue) ? durationFromPaceAndDistance(paceSeconds, Number(distanceValue)) : undefined
  const showRecovery = !isSimplified && (Number(repetitionsValue) > 1 || Number(setsValue) > 1)

  function handleVmaPercentChange(value: string) {
    setValue(`blocks.${index}.vmaPercent`, value)
    const vmaPct = Number(value)
    if (athleteVma && vmaPct) {
      const derivedPace = paceFromVmaPercent(athleteVma, vmaPct)
      if (derivedPace) setValue(`blocks.${index}.paceManual`, secondsToClock(derivedPace))
    }
  }

  function handlePaceChange(value: string) {
    setValue(`blocks.${index}.paceManual`, value)
    const paceSec = parseClockToSeconds(value)
    if (athleteVma && paceSec) {
      const derivedPercent = vmaPercentFromPace(athleteVma, paceSec)
      if (derivedPercent) setValue(`blocks.${index}.vmaPercent`, String(derivedPercent))
    }
  }

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

      <div className={isSimplified ? "grid max-w-40 grid-cols-1 gap-2" : "grid grid-cols-4 gap-2"}>
        {!isSimplified && (
          <>
            <FormField
              control={control}
              name={`blocks.${index}.sets`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">
                    Séries <span className="normal-case">(répéter le bloc)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="1"
                      className="h-8 text-sm"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`blocks.${index}.repetitions`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Répétitions</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="10"
                      className="h-8 text-sm"
                      {...field}
                    />
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
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="400"
                      className="h-8 text-sm"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}
        {computedDuration ? (
          <FormItem>
            <FormLabel className="text-xs text-muted-foreground">Durée (auto)</FormLabel>
            <p className="flex h-8 items-center text-sm font-medium">{secondsToClock(computedDuration)}</p>
          </FormItem>
        ) : (
          <FormField
            control={control}
            name={`blocks.${index}.durationManual`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">Durée</FormLabel>
                <FormControl>
                  <Input
                    placeholder="20:00"
                    className="h-8 text-sm placeholder:italic placeholder:text-muted-foreground/60"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </div>

      {!isRestBlock && (
        <div className="flex flex-wrap items-end gap-3">
          <FormField
            control={control}
            name={`blocks.${index}.vmaPercent`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">Allure en % VMA</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="100"
                    className="h-8 w-24 text-sm"
                    disabled={!bulk && !athleteVma}
                    {...field}
                    onChange={(e) => handleVmaPercentChange(e.target.value)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`blocks.${index}.paceManual`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">Allure directe</FormLabel>
                <FormControl>
                  <Input
                    placeholder="3:55/km"
                    className="h-8 w-24 text-sm"
                    {...field}
                    onChange={(e) => handlePaceChange(e.target.value)}
                  />
                </FormControl>
              </FormItem>
            )}
          />

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
      )}

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
