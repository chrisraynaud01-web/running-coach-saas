import { redirect } from "next/navigation"
import { Activity } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { SetupForm } from "@/components/auth/setup-form"

export default async function SetupPage() {
  const existingCoach = await prisma.coach.count()
  if (existingCoach > 0) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="size-5" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Bienvenue sur RunCoach</h1>
          <p className="text-sm text-muted-foreground">
            Crée ton compte coach — cette page ne fonctionne qu&apos;une seule fois.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <SetupForm />
        </div>
      </div>
    </div>
  )
}
