"use server"

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { setupSchema, type SetupInput } from "@/lib/validations/setup"

export async function createInitialCoach(input: SetupInput) {
  const parsed = setupSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  const existingCoach = await prisma.coach.count()
  if (existingCoach > 0) {
    return { success: false as const, error: "Un compte coach existe déjà. Utilise la page de connexion." }
  }

  const { name, email, password } = parsed.data

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return { success: false as const, error: "Un compte existe déjà avec cet email." }
  }

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      name,
      email,
      role: "COACH",
      passwordHash,
      coachProfile: { create: {} },
    },
  })

  return { success: true as const }
}
