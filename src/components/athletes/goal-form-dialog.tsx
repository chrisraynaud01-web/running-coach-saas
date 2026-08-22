"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Plus, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  goalSchema,
  goalTypeValues,
  goalTypeLabels,
  goalStatusValues,
  goalStatusLabels,
  type GoalInput,
} from "@/lib/validations/goal"

type ActionResult = { success: true } | { success: false; error: string }

export type GoalRecord = {
  id: string
  title: string
  type: string
  targetDate: Date | string | null
  targetValue: string | null
  isPrimary: boolean
  status: string
}

function toDateInputValue(date: Date | string | null) {
  if (!date) return ""
  const d = new Date(date)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function defaultValuesFor(goal?: GoalRecord): GoalInput {
  if (!goal) {
    return { title: "", type: "RACE", targetDate: "", targetValue: "", isPrimary: false, status: "ACTIVE" }
  }
  return {
    title: goal.title,
    type: goal.type as GoalInput["type"],
    targetDate: toDateInputValue(goal.targetDate),
    targetValue: goal.targetValue ?? "",
    isPrimary: goal.isPrimary,
    status: goal.status as GoalInput["status"],
  }
}

export function GoalFormDialog({
  goal,
  defaultPrimary,
  createAction,
  updateAction,
}: {
  goal?: GoalRecord
  defaultPrimary?: boolean
  createAction: (input: GoalInput) => Promise<ActionResult>
  updateAction: (goalId: string, input: GoalInput) => Promise<ActionResult>
}) {
  const isEdit = !!goal
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  const form = useForm({
    resolver: zodResolver(goalSchema),
    defaultValues: goal
      ? defaultValuesFor(goal)
      : { ...defaultValuesFor(undefined), isPrimary: !!defaultPrimary },
  })

  React.useEffect(() => {
    if (open) {
      form.reset(
        goal ? defaultValuesFor(goal) : { ...defaultValuesFor(undefined), isPrimary: !!defaultPrimary }
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const onSubmit = form.handleSubmit(async (values) => {
    setPending(true)
    const result = isEdit ? await updateAction(goal.id, values) : await createAction(values)
    setPending(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success(isEdit ? "Objectif mis à jour." : "Objectif ajouté.")
    setOpen(false)
    router.refresh()
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon-sm" aria-label="Modifier l'objectif" />
          ) : (
            <Button variant="outline" size="sm" />
          )
        }
      >
        {isEdit ? <Pencil className="size-3.5" /> : (
          <>
            <Plus className="size-4" />
            Ajouter un objectif
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'objectif" : "Nouvel objectif"}</DialogTitle>
          <DialogDescription>
            Un objectif principal apparaît en avant sur la fiche de l&apos;athlète.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input placeholder="Semi-marathon de Lyon" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
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
                              value ? goalTypeLabels[value as (typeof goalTypeValues)[number]] : ""
                            }
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {goalTypeValues.map((t) => (
                          <SelectItem key={t} value={t}>
                            {goalTypeLabels[t]}
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
                name="targetDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date échéance</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="targetValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cible (libre)</FormLabel>
                  <FormControl>
                    <Input placeholder="sub 1h35" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue>
                            {(value: string | null) =>
                              value ? goalStatusLabels[value as (typeof goalStatusValues)[number]] : ""
                            }
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {goalStatusValues.map((s) => (
                          <SelectItem key={s} value={s}>
                            {goalStatusLabels[s]}
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
                name="isPrimary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0 pt-6">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">Objectif principal</FormLabel>
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
