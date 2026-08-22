"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentCoach } from "@/lib/current-coach"
import { athleteMetricsSchema, type AthleteMetricsInput } from "@/lib/validations/metrics"
import { buildAthleteMetricsData } from "@/lib/metrics-helpers"

export async function addAthleteMetrics(athleteId: string, input: AthleteMetricsInput) {
  const parsed = athleteMetricsSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  const coach = await getCurrentCoach()
  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId, coachId: coach.id },
  })
  if (!athlete) {
    return { success: false as const, error: "Athlète introuvable" }
  }

  const metricsData = buildAthleteMetricsData(parsed.data)

  await prisma.athleteMetrics.create({
    data: { athleteId, ...metricsData },
  })

  if (metricsData.weightKg) {
    await prisma.athlete.update({
      where: { id: athleteId },
      data: { weightKg: metricsData.weightKg },
    })
  }

  revalidatePath(`/athletes/${athleteId}`)
  return { success: true as const }
}
