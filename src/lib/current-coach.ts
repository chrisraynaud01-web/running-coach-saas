import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function getCurrentCoach() {
  const session = await auth()
  if (!session?.user || session.user.role === "ATHLETE") {
    redirect("/login")
  }

  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
    include: { user: true },
  })
  if (!coach) {
    redirect("/login")
  }

  return coach
}
