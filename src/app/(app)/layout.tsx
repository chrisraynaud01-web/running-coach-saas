import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppTopbar } from "@/components/layout/app-topbar"
import { getCurrentCoach } from "@/lib/current-coach"

export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const coach = await getCurrentCoach()

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <AppSidebar
        variant="coach"
        userName={coach.user.name ?? coach.user.email}
        userSubtitle="Coach running"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
