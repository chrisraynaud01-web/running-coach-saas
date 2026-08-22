import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function getCurrentAthlete() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ATHLETE") {
    redirect("/login")
  }

  const athlete = await prisma.athlete.findUnique({
    where: { userId: session.user.id },
  })
  if (!athlete) {
    redirect("/login")
  }

  return athlete
}
