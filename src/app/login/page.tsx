import { Activity } from "lucide-react"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="size-5" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">RunCoach</h1>
          <p className="text-sm text-muted-foreground">
            Connecte-toi à ton espace coach ou athlète.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
