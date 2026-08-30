"use server"

import { revalidatePath } from "next/cache"
import { put, del } from "@vercel/blob"
import { prisma } from "@/lib/prisma"
import { getCurrentAthlete } from "@/lib/current-athlete"
import { journalEntrySchema, type JournalEntryInput } from "@/lib/validations/journal"
import { workoutResultSchema, type WorkoutResultInput } from "@/lib/validations/workout-result"
import { athleteMetricsSchema, type AthleteMetricsInput } from "@/lib/validations/metrics"
import { goalSchema, type GoalInput } from "@/lib/validations/goal"
import { toOptionalFloat, toOptionalInt } from "@/lib/validations/shared"
import { parseClockToSeconds } from "@/lib/time"
import { buildAthleteMetricsData } from "@/lib/metrics-helpers"

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

export async function updateJournalEntry(entryId: string, input: JournalEntryInput) {
  const parsed = journalEntrySchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  const athlete = await getCurrentAthlete()
  const data = parsed.data

  await prisma.journalEntry.updateMany({
    where: { id: entryId, athleteId: athlete.id },
    data: {
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

export async function addMyMetrics(input: AthleteMetricsInput) {
  const parsed = athleteMetricsSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  const athlete = await getCurrentAthlete()
  const metricsData = buildAthleteMetricsData(parsed.data)

  await prisma.athleteMetrics.create({
    data: { athleteId: athlete.id, ...metricsData },
  })

  if (metricsData.weightKg) {
    await prisma.athlete.update({
      where: { id: athlete.id },
      data: { weightKg: metricsData.weightKg },
    })
  }

  revalidatePath("/athlete/profil")
  return { success: true as const }
}

async function unsetOtherPrimaryGoals(athleteId: string, excludeGoalId?: string) {
  await prisma.goal.updateMany({
    where: { athleteId, isPrimary: true, ...(excludeGoalId ? { id: { not: excludeGoalId } } : {}) },
    data: { isPrimary: false },
  })
}

export async function createMyGoal(input: GoalInput) {
  const parsed = goalSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  const athlete = await getCurrentAthlete()
  const data = parsed.data

  if (data.isPrimary) await unsetOtherPrimaryGoals(athlete.id)

  await prisma.goal.create({
    data: {
      athleteId: athlete.id,
      title: data.title,
      type: data.type,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      targetValue: data.targetValue || null,
      isPrimary: data.isPrimary,
      status: data.status,
    },
  })

  revalidatePath("/athlete/profil")
  return { success: true as const }
}

export async function updateMyGoal(goalId: string, input: GoalInput) {
  const parsed = goalSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  const athlete = await getCurrentAthlete()
  const data = parsed.data

  if (data.isPrimary) await unsetOtherPrimaryGoals(athlete.id, goalId)

  await prisma.goal.updateMany({
    where: { id: goalId, athleteId: athlete.id },
    data: {
      title: data.title,
      type: data.type,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      targetValue: data.targetValue || null,
      isPrimary: data.isPrimary,
      status: data.status,
    },
  })

  revalidatePath("/athlete/profil")
  return { success: true as const }
}

export async function submitWorkoutResult(input: WorkoutResultInput) {
  const parsed = workoutResultSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  const athlete = await getCurrentAthlete()
  const { workoutId, blocks } = parsed.data
  const rpe = toOptionalInt(parsed.data.rpe)

  const workout = await prisma.workout.findUnique({
    where: { id: workoutId, athleteId: athlete.id },
  })
  if (!workout) {
    return { success: false as const, error: "Séance introuvable" }
  }

  await prisma.$transaction([
    ...blocks.map((b) => {
      const repSeconds = (b.actualReps ?? []).map((r) => parseClockToSeconds(r) ?? 0)
      const hasRepDetail = repSeconds.some((s) => s > 0)
      const actualDurationSeconds = hasRepDetail
        ? repSeconds.reduce((sum, s) => sum + s, 0)
        : (parseClockToSeconds(b.actualDuration) ?? null)

      return prisma.workoutBlock.updateMany({
        where: { id: b.blockId, workoutId },
        data: {
          actualDurationSeconds,
          actualRepSecondsList: hasRepDetail ? repSeconds : [],
          actualNotes: b.actualNotes || null,
        },
      })
    }),
    prisma.workout.update({
      where: { id: workoutId },
      data: { status: "COMPLETED", completedAt: new Date() },
    }),
  ])

  // Le RPE de la séance est stocké dans le journal (même table que les entrées de journal
  // classiques) pour rester visible dans l'historique et alimenter les alertes du dashboard —
  // on met à jour l'entrée existante pour cette séance si elle existe déjà, sinon on la crée.
  if (rpe) {
    const existingEntry = await prisma.journalEntry.findFirst({
      where: { athleteId: athlete.id, workoutId },
      orderBy: { createdAt: "desc" },
    })
    if (existingEntry) {
      await prisma.journalEntry.update({ where: { id: existingEntry.id }, data: { rpe } })
    } else {
      await prisma.journalEntry.create({ data: { athleteId: athlete.id, workoutId, rpe } })
    }
    revalidatePath("/athlete/journal")
  }

  revalidatePath("/athlete")
  return { success: true as const }
}

const MAX_PHOTOS_PER_WORKOUT = 6
const MAX_PHOTO_SIZE_BYTES = 8 * 1024 * 1024

export async function addWorkoutPhoto(workoutId: string, formData: FormData) {
  const athlete = await getCurrentAthlete()

  const file = formData.get("photo")
  if (!(file instanceof File) || file.size === 0) {
    return { success: false as const, error: "Aucune photo reçue" }
  }
  if (!file.type.startsWith("image/")) {
    return { success: false as const, error: "Le fichier doit être une image" }
  }
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return { success: false as const, error: "Photo trop lourde (8 Mo max)" }
  }

  const workout = await prisma.workout.findUnique({
    where: { id: workoutId, athleteId: athlete.id },
    select: { photoUrls: true },
  })
  if (!workout) {
    return { success: false as const, error: "Séance introuvable" }
  }
  if (workout.photoUrls.length >= MAX_PHOTOS_PER_WORKOUT) {
    return { success: false as const, error: `Maximum ${MAX_PHOTOS_PER_WORKOUT} photos par séance` }
  }

  let blob
  try {
    blob = await put(`workouts/${workoutId}/${file.name}`, file, { access: "public" })
  } catch (err) {
    console.error("addWorkoutPhoto: blob upload failed", err)
    return { success: false as const, error: "Envoi de la photo impossible pour le moment" }
  }

  await prisma.workout.update({
    where: { id: workoutId },
    data: { photoUrls: { push: blob.url } },
  })

  revalidatePath("/athlete")
  return { success: true as const, url: blob.url }
}

export async function removeWorkoutPhoto(workoutId: string, url: string) {
  const athlete = await getCurrentAthlete()

  const workout = await prisma.workout.findUnique({
    where: { id: workoutId, athleteId: athlete.id },
    select: { photoUrls: true },
  })
  if (!workout) {
    return { success: false as const, error: "Séance introuvable" }
  }

  await prisma.workout.update({
    where: { id: workoutId },
    data: { photoUrls: workout.photoUrls.filter((u) => u !== url) },
  })

  try {
    await del(url)
  } catch {
    // Suppression du fichier non bloquante : l'important est qu'il ne soit plus lié à la séance.
  }

  revalidatePath("/athlete")
  return { success: true as const }
}
