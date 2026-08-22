"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentCoach } from "@/lib/current-coach"
import { goalSchema, type GoalInput } from "@/lib/validations/goal"

async function assertAthleteOwnership(athleteId: string) {
  const coach = await getCurrentCoach()
  const athlete = await prisma.athlete.findUnique({ where: { id: athleteId, coachId: coach.id } })
  if (!athlete) throw new Error("Athlète introuvable")
  return athlete
}

export async function createGoal(athleteId: string, input: GoalInput) {
  const parsed = goalSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  try {
    await assertAthleteOwnership(athleteId)
  } catch {
    return { success: false as const, error: "Athlète introuvable" }
  }

  const data = parsed.data

  if (data.isPrimary) {
    await prisma.goal.updateMany({ where: { athleteId, isPrimary: true }, data: { isPrimary: false } })
  }

  await prisma.goal.create({
    data: {
      athleteId,
      title: data.title,
      type: data.type,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      targetValue: data.targetValue || null,
      isPrimary: data.isPrimary,
      status: data.status,
    },
  })

  revalidatePath(`/athletes/${athleteId}`)
  return { success: true as const }
}

export async function updateGoal(athleteId: string, goalId: string, input: GoalInput) {
  const parsed = goalSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  try {
    await assertAthleteOwnership(athleteId)
  } catch {
    return { success: false as const, error: "Athlète introuvable" }
  }

  const data = parsed.data

  if (data.isPrimary) {
    await prisma.goal.updateMany({
      where: { athleteId, isPrimary: true, id: { not: goalId } },
      data: { isPrimary: false },
    })
  }

  await prisma.goal.updateMany({
    where: { id: goalId, athleteId },
    data: {
      title: data.title,
      type: data.type,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      targetValue: data.targetValue || null,
      isPrimary: data.isPrimary,
      status: data.status,
    },
  })

  revalidatePath(`/athletes/${athleteId}`)
  return { success: true as const }
}
