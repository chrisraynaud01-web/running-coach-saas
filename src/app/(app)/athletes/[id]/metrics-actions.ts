"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentCoach } from "@/lib/current-coach"
import { athleteMetricsSchema, type AthleteMetricsInput } from "@/lib/validations/metrics"
import { buildAthleteMetricsData } from "@/lib/metrics-helpers"

// Le poids affiché sur la fiche athlète suit toujours le relevé le plus récent — à
// resynchroniser après toute création/modification/suppression, pas seulement après un ajout.
async function syncAthleteWeightFromLatestMetrics(athleteId: string) {
  const latest = await prisma.athleteMetrics.findFirst({
    where: { athleteId },
    orderBy: { recordedAt: "desc" },
    select: { weightKg: true },
  })
  await prisma.athlete.update({
    where: { id: athleteId },
    data: { weightKg: latest?.weightKg ?? null },
  })
}

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
  await syncAthleteWeightFromLatestMetrics(athleteId)

  revalidatePath(`/athletes/${athleteId}`)
  return { success: true as const }
}

export async function updateAthleteMetrics(athleteId: string, metricsId: string, input: AthleteMetricsInput) {
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

  await prisma.athleteMetrics.updateMany({
    where: { id: metricsId, athleteId },
    data: metricsData,
  })
  await syncAthleteWeightFromLatestMetrics(athleteId)

  revalidatePath(`/athletes/${athleteId}`)
  return { success: true as const }
}

export async function deleteAthleteMetrics(athleteId: string, metricsId: string) {
  const coach = await getCurrentCoach()
  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId, coachId: coach.id },
  })
  if (!athlete) {
    return { success: false as const, error: "Athlète introuvable" }
  }

  await prisma.athleteMetrics.deleteMany({ where: { id: metricsId, athleteId } })
  await syncAthleteWeightFromLatestMetrics(athleteId)

  revalidatePath(`/athletes/${athleteId}`)
  return { success: true as const }
}
