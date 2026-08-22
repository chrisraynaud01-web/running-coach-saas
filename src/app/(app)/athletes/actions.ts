"use server"

import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { getCurrentCoach } from "@/lib/current-coach"
import { athleteSchema, type AthleteInput } from "@/lib/validations/athlete"
import { toOptionalFloat } from "@/lib/validations/shared"
import { generateTempPassword } from "@/lib/generate-password"
import { hasAnyMetric, buildAthleteMetricsData } from "@/lib/metrics-helpers"

export async function createAthlete(input: AthleteInput) {
  const parsed = athleteSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  const coach = await getCurrentCoach()
  const data = parsed.data

  const metricsInput = {
    vma: data.vma,
    maxHeartRate: data.maxHeartRate,
    restingHeartRate: data.restingHeartRate,
    weightKg: data.weightKg,
    time5k: data.time5k,
    time10k: data.time10k,
    timeHalfMarathon: data.timeHalfMarathon,
    timeMarathon: data.timeMarathon,
  }
  const withMetrics = hasAnyMetric(metricsInput)
  const metricsData = withMetrics ? buildAthleteMetricsData(metricsInput) : null

  const athlete = await prisma.athlete.create({
    data: {
      coachId: coach.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || null,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      sex: data.sex,
      heightCm: toOptionalFloat(data.heightCm) ?? null,
      weightKg: metricsData?.weightKg ?? null,
      metricsHistory: metricsData ? { create: metricsData } : undefined,
    },
  })

  await prisma.conversation.create({
    data: { coachId: coach.id, athleteId: athlete.id },
  })

  revalidatePath("/athletes")
  return { success: true as const, athleteId: athlete.id }
}

export async function updateAthlete(athleteId: string, input: AthleteInput) {
  const parsed = athleteSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  const coach = await getCurrentCoach()
  const data = parsed.data

  try {
    await prisma.athlete.update({
      where: { id: athleteId, coachId: coach.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        sex: data.sex,
        heightCm: toOptionalFloat(data.heightCm) ?? null,
      },
    })
  } catch {
    return { success: false as const, error: "Athlète introuvable" }
  }

  revalidatePath("/athletes")
  revalidatePath(`/athletes/${athleteId}`)
  return { success: true as const }
}

export async function deleteAthlete(athleteId: string) {
  const coach = await getCurrentCoach()

  try {
    await prisma.athlete.delete({
      where: { id: athleteId, coachId: coach.id },
    })
  } catch {
    return { success: false as const, error: "Athlète introuvable" }
  }

  revalidatePath("/athletes")
  return { success: true as const }
}

export async function createAthleteAccess(athleteId: string) {
  const coach = await getCurrentCoach()

  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId, coachId: coach.id },
  })
  if (!athlete) {
    return { success: false as const, error: "Athlète introuvable" }
  }
  if (athlete.userId) {
    return { success: false as const, error: "Cet athlète a déjà un accès." }
  }

  const existingUser = await prisma.user.findUnique({ where: { email: athlete.email } })
  if (existingUser) {
    return {
      success: false as const,
      error: "Un compte existe déjà avec cet email. Change l'email de l'athlète d'abord.",
    }
  }

  const tempPassword = generateTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 10)

  const user = await prisma.user.create({
    data: {
      email: athlete.email,
      name: `${athlete.firstName} ${athlete.lastName}`,
      role: "ATHLETE",
      passwordHash,
    },
  })

  await prisma.athlete.update({
    where: { id: athleteId },
    data: { userId: user.id },
  })

  revalidatePath(`/athletes/${athleteId}`)
  return { success: true as const, email: athlete.email, password: tempPassword }
}

export async function resetAthleteAccessPassword(athleteId: string) {
  const coach = await getCurrentCoach()

  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId, coachId: coach.id },
  })
  if (!athlete?.userId) {
    return { success: false as const, error: "Cet athlète n'a pas encore d'accès." }
  }

  const tempPassword = generateTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 10)

  await prisma.user.update({
    where: { id: athlete.userId },
    data: { passwordHash },
  })

  return { success: true as const, email: athlete.email, password: tempPassword }
}

export async function archiveAthlete(athleteId: string) {
  const coach = await getCurrentCoach()

  await prisma.athlete.update({
    where: { id: athleteId, coachId: coach.id },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  })

  revalidatePath("/athletes")
  return { success: true as const }
}

export async function reactivateAthlete(athleteId: string) {
  const coach = await getCurrentCoach()

  await prisma.athlete.update({
    where: { id: athleteId, coachId: coach.id },
    data: { status: "ACTIVE", archivedAt: null },
  })

  revalidatePath("/athletes")
  return { success: true as const }
}
