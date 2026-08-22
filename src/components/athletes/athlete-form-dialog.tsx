"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { UserPlus } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { athleteSchema, type AthleteInput } from "@/lib/validations/athlete"
import { createAthlete, updateAthlete } from "@/app/(app)/athletes/actions"

export type AthleteRecord = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  birthDate: Date | string | null
  sex: "MALE" | "FEMALE" | "OTHER" | null
  heightCm: number | null
  weightKg: number | null
}

function toDateInputValue(date: Date | string | null) {
  if (!date) return ""
  const d = new Date(date)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function defaultValuesFor(athlete?: AthleteRecord): AthleteInput {
  if (!athlete) {
    return { firstName: "", lastName: "", email: "", phone: "", birthDate: "" }
  }
  return {
    firstName: athlete.firstName,
    lastName: athlete.lastName,
    email: athlete.email,
    phone: athlete.phone ?? "",
    birthDate: toDateInputValue(athlete.birthDate),
    sex: athlete.sex ?? undefined,
    heightCm: athlete.heightCm != null ? String(athlete.heightCm) : "",
    weightKg: athlete.weightKg != null ? String(athlete.weightKg) : "",
  }
}

type Props = {
  athlete?: AthleteRecord
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AthleteFormDialog({ athlete, open: openProp, onOpenChange: onOpenChangeProp }: Props) {
  const isEdit = !!athlete
  const isControlled = openProp !== undefined
  const router = useRouter()
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  const open = isControlled ? openProp : internalOpen
  const setOpen = isControlled ? onOpenChangeProp! : setInternalOpen

  const form = useForm({
    resolver: zodResolver(athleteSchema),
    defaultValues: defaultValuesFor(athlete),
  })

  React.useEffect(() => {
    if (open) form.reset(defaultValuesFor(athlete))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const onSubmit = form.handleSubmit(async (values) => {
    setPending(true)
    const result = isEdit ? await updateAthlete(athlete.id, values) : await createAthlete(values)
    setPending(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success(isEdit ? "Athlète mis à jour." : `${values.firstName} ${values.lastName} a été ajouté(e).`)
    setOpen(false)
    router.refresh()
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger render={<Button size="sm" />}>
          <UserPlus className="size-4" />
          Nouvel athlète
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'athlète" : "Nouvel athlète"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Mets à jour les informations de l'athlète."
              : "Ajoute les informations de base. Tu pourras compléter le profil ensuite."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input placeholder="Sophie" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Marchand" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="sophie@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="+33 6 12 34 56 78" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de naissance</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sexe</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FEMALE">Femme</SelectItem>
                        <SelectItem value="MALE">Homme</SelectItem>
                        <SelectItem value="OTHER">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="heightCm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taille (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="170" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weightKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poids (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="60" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer l'athlète"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
