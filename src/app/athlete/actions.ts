"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { getCurrentAthlete } from "@/lib/current-athlete"
import { journalEntrySchema, type JournalEntryInput } from "@/lib/validations/journal"
import { toOptionalFloat, toOptionalInt } from "@/lib/validations/shared"

export async function submitJournalEntry(input: JournalEntryInput) {
  const parsed = journalEntrySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  const athlete = await getCurrentAthlete()
  const data = parsed.data

  await prisma.journalEntry.create({
    data: {
      athleteId: athlete.id,
      workoutId: data.workoutId || null,
      rpe: toOptionalInt(data.rpe),
      fatigue: toOptionalInt(data.fatigue),
      sleepQuality: toOptionalInt(data.sleepQuality),
      sleepHours: toOptionalFloat(data.sleepHours),
      stress: toOptionalInt(data.stress),
      comment: data.comment || null,
    },
  })

  revalidatePath("/athlete")
  revalidatePath("/athlete/journal")
  return { success: true as const }
}

export async function markMyWorkoutCompleted(workoutId: string) {
  const athlete = await getCurrentAthlete()

  await prisma.workout.updateMany({
    where: { id: workoutId, athleteId: athlete.id },
    data: { status: "COMPLETED", completedAt: new Date() },
  })

  revalidatePath("/athlete")
  return { success: true as const }
}
