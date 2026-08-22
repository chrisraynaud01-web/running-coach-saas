"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AthleteFormDialog, type AthleteRecord } from "@/components/athletes/athlete-form-dialog"
import { archiveAthlete, deleteAthlete, reactivateAthlete } from "@/app/(app)/athletes/actions"

export function AthleteActionsMenu({
  athlete,
  redirectAfterDeleteTo,
}: {
  athlete: AthleteRecord & { status: string }
  redirectAfterDeleteTo?: string
}) {
  const router = useRouter()
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  async function handleArchiveToggle() {
    setPending(true)
    const result =
      athlete.status === "ARCHIVED"
        ? await reactivateAthlete(athlete.id)
        : await archiveAthlete(athlete.id)
    setPending(false)

    if (!result.success) {
      toast.error("Une erreur est survenue.")
      return
    }
    toast.success(athlete.status === "ARCHIVED" ? "Athlète réactivé." : "Athlète archivé.")
    router.refresh()
  }

  async function handleDelete() {
    setPending(true)
    const result = await deleteAthlete(athlete.id)
    setPending(false)
    setDeleteOpen(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success("Athlète supprimé.")
    if (redirectAfterDeleteTo) {
      router.push(redirectAfterDeleteTo)
    } else {
      router.refresh()
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" className="size-8" aria-label="Actions" />}
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem disabled={pending} onClick={handleArchiveToggle}>
            {athlete.status === "ARCHIVED" ? (
              <>
                <ArchiveRestore className="size-4" />
                Réactiver
              </>
            ) : (
              <>
                <Archive className="size-4" />
                Archiver
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AthleteFormDialog athlete={athlete} open={editOpen} onOpenChange={setEditOpen} />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {athlete.firstName} {athlete.lastName} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les séances, objectifs et données
              associées à cet athlète seront définitivement supprimés. Si tu veux juste le
              masquer temporairement, utilise plutôt « Archiver ».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={handleDelete}
              className="bg-[--color-critical] text-white hover:bg-[--color-critical]/90"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
