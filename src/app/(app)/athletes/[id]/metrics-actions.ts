"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentCoach } from "@/lib/current-coach"
import { athleteMetricsSchema, type AthleteMetricsInput } from "@/lib/validations/metrics"
import { toOptionalFloat, toOptionalInt } from "@/lib/validations/shared"
import { parseClockToSeconds, paceFromRaceTime } from "@/lib/time"

const HALF_MARATHON_KM = 21.0975
const MARATHON_KM = 42.195

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

  const data = parsed.data
  const weightKg = toOptionalFloat(data.weightKg)

  await prisma.athleteMetrics.create({
    data: {
      athleteId,
      vma: toOptionalFloat(data.vma),
      maxHeartRate: toOptionalInt(data.maxHeartRate),
      restingHeartRate: toOptionalInt(data.restingHeartRate),
      weightKg,
      pace5k: paceFromRaceTime(parseClockToSeconds(data.time5k), 5),
      pace10k: paceFromRaceTime(parseClockToSeconds(data.time10k), 10),
      paceHalfMarathon: paceFromRaceTime(parseClockToSeconds(data.timeHalfMarathon), HALF_MARATHON_KM),
      paceMarathon: paceFromRaceTime(parseClockToSeconds(data.timeMarathon), MARATHON_KM),
      source: "MANUAL",
    },
  })

  if (weightKg) {
    await prisma.athlete.update({
      where: { id: athleteId },
      data: { weightKg },
    })
  }

  revalidatePath(`/athletes/${athleteId}`)
  return { success: true as const }
}
