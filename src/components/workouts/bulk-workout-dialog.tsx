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
import { Checkbox } from "@/components/ui/checkbox"
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
import { bulkWorkoutSchema, workoutTypeValues, workoutTypeLabels } from "@/lib/validations/workout"
import { createWorkoutForAthletes } from "@/app/(app)/workouts/actions"
import { TIME_OF_DAY_VALUES, timeOfDayLabels } from "@/lib/time"
import { WorkoutBlocksEditor } from "@/components/athletes/workout-blocks-editor"

type Athlete = { id: string; firstName: string; lastName: string }

function toDateInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function defaultValues() {
  return {
    athleteIds: [] as string[],
    title: "",
    type: "ENDURANCE_FONDAMENTALE" as const,
    scheduledDate: toDateInputValue(new Date()),
    timeOfDay: "MORNING" as const,
    coachNotes: "",
    blocks: [],
  }
}

export function BulkWorkoutDialog({ athletes }: { athletes: Athlete[] }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  const form = useForm({
    resolver: zodResolver(bulkWorkoutSchema),
    defaultValues: defaultValues(),
  })

  React.useEffect(() => {
    if (open) form.reset(defaultValues())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const selectedIds = form.watch("athleteIds")

  const onSubmit = form.handleSubmit(async (values) => {
    setPending(true)
    const result = await createWorkoutForAthletes(values)
    setPending(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success(
      `Séance ajoutée pour ${result.count} athlète${result.count > 1 ? "s" : ""}.`
    )
    setOpen(false)
    router.refresh()
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        Nouvelle séance
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouvelle séance</DialogTitle>
          <DialogDescription>
            Planifie une séance pour un ou plusieurs athlètes en une fois. La même structure de
            blocs est appliquée à chacun, mais l&apos;allure en % VMA est recalculée
            individuellement à partir de la VMA de chaque athlète.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-5">
            <FormField
              control={form.control}
              name="athleteIds"
              render={() => (
                <FormItem>
                  <FormLabel>
                    Athlètes {selectedIds.length > 0 && `(${selectedIds.length} sélectionné${selectedIds.length > 1 ? "s" : ""})`}
                  </FormLabel>
                  <FormControl>
                    <div className="grid max-h-40 grid-cols-2 gap-1.5 overflow-y-auto rounded-md border p-2 sm:grid-cols-3">
                      {athletes.map((a) => {
                        const checked = selectedIds.includes(a.id)
                        return (
                          <label
                            key={a.id}
                            className="flex items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => {
                                const next = value
                                  ? [...selectedIds, a.id]
                                  : selectedIds.filter((id) => id !== a.id)
                                form.setValue("athleteIds", next, { shouldValidate: true })
                              }}
                            />
                            <span className="truncate">
                              {a.firstName} {a.lastName}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <WorkoutBlocksEditor
              control={form.control}
              bulk
              athleteVmaNote="L'allure en % VMA sera calculée séparément pour chaque athlète sélectionné, à partir de sa propre VMA."
            />

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
                {pending ? "Enregistrement..." : "Ajouter la séance"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
