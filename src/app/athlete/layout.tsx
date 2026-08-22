import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppTopbar } from "@/components/layout/app-topbar"
import { getCurrentAthlete } from "@/lib/current-athlete"
import { prisma } from "@/lib/prisma"

export default async function AthleteShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const athlete = await getCurrentAthlete()
  const user = await prisma.user.findUnique({ where: { id: athlete.userId! } })

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <AppSidebar
        variant="athlete"
        userName={user?.name ?? `${athlete.firstName} ${athlete.lastName}`}
        userSubtitle="Athlète"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar searchPlaceholder="Rechercher..." />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
