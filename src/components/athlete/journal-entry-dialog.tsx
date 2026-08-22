"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { NotebookPen, Pencil } from "lucide-react"

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
import { journalEntrySchema, type JournalEntryInput } from "@/lib/validations/journal"
import { submitJournalEntry, updateJournalEntry } from "@/app/athlete/actions"

const SCALE = Array.from({ length: 10 }, (_, i) => String(i + 1))

export type JournalEntryRecord = {
  id: string
  workoutId: string | null
  rpe: number | null
  fatigue: number | null
  sleepQuality: number | null
  sleepHours: number | null
  stress: number | null
  comment: string | null
}

function emptyValues(workoutId?: string): JournalEntryInput {
  return {
    workoutId: workoutId ?? "",
    rpe: "",
    fatigue: "",
    sleepQuality: "",
    sleepHours: "",
    stress: "",
    comment: "",
  }
}

function valuesFromEntry(entry: JournalEntryRecord): JournalEntryInput {
  return {
    workoutId: entry.workoutId ?? "",
    rpe: entry.rpe != null ? String(entry.rpe) : "",
    fatigue: entry.fatigue != null ? String(entry.fatigue) : "",
    sleepQuality: entry.sleepQuality != null ? String(entry.sleepQuality) : "",
    sleepHours: entry.sleepHours != null ? String(entry.sleepHours) : "",
    stress: entry.stress != null ? String(entry.stress) : "",
    comment: entry.comment ?? "",
  }
}

export function JournalEntryDialog({
  workoutId,
  workoutTitle,
  entry,
}: {
  workoutId?: string
  workoutTitle?: string
  entry?: JournalEntryRecord
}) {
  const isEdit = !!entry
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  const form = useForm({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: entry ? valuesFromEntry(entry) : emptyValues(workoutId),
  })

  React.useEffect(() => {
    if (open) form.reset(entry ? valuesFromEntry(entry) : emptyValues(workoutId))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const onSubmit = form.handleSubmit(async (values) => {
    setPending(true)
    const result = isEdit ? await updateJournalEntry(entry.id, values) : await submitJournalEntry(values)
    setPending(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success(isEdit ? "Entrée mise à jour." : "Retour enregistré. Merci !")
    setOpen(false)
    router.refresh()
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon-sm" aria-label="Modifier l'entrée" />
          ) : (
            <Button size="sm" variant={workoutId ? "outline" : "default"} />
          )
        }
      >
        {isEdit ? (
          <Pencil className="size-3.5" />
        ) : (
          <>
            <NotebookPen className="size-4" />
            {workoutId ? "Donner mon retour" : "Nouvelle entrée"}
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Journal d&apos;entraînement</DialogTitle>
          <DialogDescription>
            {workoutTitle ? `À propos de : ${workoutTitle}` : "Comment tu te sens aujourd'hui ?"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <ScaleField control={form.control} name="rpe" label="Ressenti (RPE)" />
              <ScaleField control={form.control} name="fatigue" label="Fatigue" />
              <ScaleField control={form.control} name="sleepQuality" label="Qualité du sommeil" />
              <ScaleField control={form.control} name="stress" label="Stress" />
            </div>

            <FormField
              control={form.control}
              name="sleepHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heures de sommeil</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.5" placeholder="7.5" className="max-w-32" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commentaire libre</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Douleurs, sensations, contexte..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Envoi..." : "Envoyer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function ScaleField({
  control,
  name,
  label,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any
  name: "rpe" | "fatigue" | "sleepQuality" | "stress"
  label: string
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs text-muted-foreground">{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger className="h-8 w-full text-sm">
                <SelectValue placeholder="—">
                  {(value: string | null) => (value ? `${value}/10` : "—")}
                </SelectValue>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {SCALE.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}/10
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  )
}
