"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { KeyRound, Copy, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createAthleteAccess, resetAthleteAccessPassword } from "@/app/(app)/athletes/actions"

export function AthleteAccessCard({
  athleteId,
  hasAccess,
  accessEmail,
}: {
  athleteId: string
  hasAccess: boolean
  accessEmail?: string
}) {
  const router = useRouter()
  const [pending, setPending] = React.useState(false)
  const [credentials, setCredentials] = React.useState<{ email: string; password: string } | null>(
    null
  )

  async function handleCreate() {
    setPending(true)
    const result = await createAthleteAccess(athleteId)
    setPending(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    setCredentials({ email: result.email, password: result.password })
    router.refresh()
  }

  async function handleReset() {
    setPending(true)
    const result = await resetAthleteAccessPassword(athleteId)
    setPending(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    setCredentials({ email: result.email, password: result.password })
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <KeyRound className="size-4 text-muted-foreground" />
        <CardTitle className="text-sm font-semibold">Accès athlète</CardTitle>
      </CardHeader>
      <CardContent>
        {hasAccess ? (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-sm text-[--color-good]">
              <CheckCircle2 className="size-4" />
              Accès activé
            </p>
            {accessEmail && (
              <p className="text-xs text-muted-foreground">
                Connexion avec : <span className="font-mono">{accessEmail}</span>
              </p>
            )}
            <Button size="sm" variant="outline" disabled={pending} onClick={handleReset}>
              {pending ? "..." : "Réinitialiser le mot de passe"}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Crée un accès pour que cet athlète consulte son planning et donne son retour.
            </p>
            <Button size="sm" disabled={pending} onClick={handleCreate}>
              {pending ? "Création..." : "Créer un accès athlète"}
            </Button>
          </div>
        )}
      </CardContent>

      <Dialog open={!!credentials} onOpenChange={(open) => !open && setCredentials(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Identifiants</DialogTitle>
            <DialogDescription>
              Communique ces identifiants à ton athlète. Ils ne seront plus affichés ensuite.
            </DialogDescription>
          </DialogHeader>
          {credentials && (
            <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
              <CredentialRow label="Email" value={credentials.email} />
              <CredentialRow label="Mot de passe" value={credentials.password} />
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCredentials(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function CredentialRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-mono text-sm">{value}</p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Copier ${label}`}
        onClick={() => {
          navigator.clipboard.writeText(value)
          toast.success(`${label} copié.`)
        }}
      >
        <Copy className="size-3.5" />
      </Button>
    </div>
  )
}
