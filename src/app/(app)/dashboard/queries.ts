import { startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, format } from "date-fns"
import { fr } from "date-fns/locale"
import { prisma } from "@/lib/prisma"
import { workoutTypeLabels, type workoutTypeValues } from "@/lib/validations/workout"
import { formatMonthLabel } from "@/lib/format"
import type { CalendarSession } from "@/components/dashboard/month-calendar"

const INACTIVE_AFTER_DAYS = 7

function workoutLoadMeters(w: { plannedDistanceMeters: number | null; actualDistanceMeters: number | null }) {
  return w.actualDistanceMeters ?? w.plannedDistanceMeters ?? 0
}

export async function getDashboardData(coachId: string, athleteId?: string) {
  const now = new Date()

  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = startOfWeek(subWeeks(now, 7 - i), { weekStartsOn: 1 })
    const end = endOfWeek(start, { weekStartsOn: 1 })
    return { start, end, label: format(start, "d MMM", { locale: fr }) }
  })
  const rangeStart = weeks[0].start
  const rangeEnd = weeks[weeks.length - 1].end

  const athleteScope = athleteId ? { coachId, id: athleteId } : { coachId }
  const workoutScope = athleteId ? { coachId, id: athleteId } : { coachId }

  const calendarMonth = new Date()
  const calendarGridStart = startOfWeek(startOfMonth(calendarMonth), { weekStartsOn: 1 })
  const calendarGridEnd = endOfWeek(endOfMonth(calendarMonth), { weekStartsOn: 1 })

  const [athletes, allAthletes, rangeWorkouts, completedWorkouts, journalEntries, upcomingGoals] =
    await Promise.all([
      prisma.athlete.findMany({
        where: { ...athleteScope, status: { not: "ARCHIVED" } },
        select: { id: true, firstName: true, lastName: true, createdAt: true },
      }),
      // Liste complète (non filtrée par athlète) pour alimenter le sélecteur de filtre.
      prisma.athlete.findMany({
        where: { coachId, status: { not: "ARCHIVED" } },
        select: { id: true, firstName: true, lastName: true },
        orderBy: { firstName: "asc" },
      }),
      prisma.workout.findMany({
        where: { athlete: workoutScope, scheduledDate: { gte: rangeStart, lte: rangeEnd } },
        select: {
          scheduledDate: true,
          status: true,
          type: true,
          plannedDistanceMeters: true,
          actualDistanceMeters: true,
        },
      }),
      prisma.workout.findMany({
        where: { athlete: workoutScope, status: "COMPLETED" },
        select: { athleteId: true, scheduledDate: true },
        orderBy: { scheduledDate: "desc" },
      }),
      prisma.journalEntry.findMany({
        where: { athlete: workoutScope, date: { gte: subWeeks(now, 2) } },
        select: { athleteId: true, date: true, rpe: true, fatigue: true, sleepQuality: true, stress: true },
        orderBy: { date: "desc" },
      }),
      prisma.goal.findMany({
        where: { athlete: workoutScope, status: "ACTIVE", targetDate: { gte: now } },
        orderBy: { targetDate: "asc" },
        take: 5,
        select: {
          id: true,
          title: true,
          type: true,
          targetDate: true,
          athlete: { select: { firstName: true, lastName: true } },
        },
      }),
    ])

  const calendarWorkouts = await prisma.workout.findMany({
    where: { athlete: workoutScope, scheduledDate: { gte: calendarGridStart, lte: calendarGridEnd } },
    select: {
      id: true,
      title: true,
      status: true,
      scheduledDate: true,
      athleteId: true,
      athlete: { select: { firstName: true, lastName: true } },
    },
    orderBy: { scheduledDate: "asc" },
  })

  const calendarSessions: CalendarSession[] = calendarWorkouts.map((w) => ({
    id: w.id,
    title: w.title,
    status: w.status,
    scheduledDate: w.scheduledDate,
    athleteId: w.athleteId,
    athleteName: `${w.athlete.firstName} ${w.athlete.lastName[0]}.`,
  }))

  // --- Charge hebdomadaire (8 semaines) + séances de la semaine + tendance ---
  const weeklyLoad = weeks.map((w) => ({ week: w.label, volumeKm: 0, seances: 0 }))
  for (const w of rangeWorkouts) {
    const idx = weeks.findIndex((bucket) => w.scheduledDate >= bucket.start && w.scheduledDate <= bucket.end)
    if (idx === -1) continue
    weeklyLoad[idx].volumeKm += workoutLoadMeters(w) / 1000
    weeklyLoad[idx].seances += 1
  }
  weeklyLoad.forEach((w) => (w.volumeKm = Math.round(w.volumeKm * 10) / 10))

  const currentWeekLoad = weeklyLoad[weeklyLoad.length - 1].volumeKm
  const previousWeekLoad = weeklyLoad[weeklyLoad.length - 2]?.volumeKm ?? 0
  const weeklyLoadTrendPct =
    previousWeekLoad > 0 ? Math.round(((currentWeekLoad - previousWeekLoad) / previousWeekLoad) * 100) : undefined
  const sessionsThisWeek = weeklyLoad[weeklyLoad.length - 1].seances

  // --- Taux de complétion (séances passées sur les 8 dernières semaines) ---
  const pastWorkouts = rangeWorkouts.filter((w) => w.scheduledDate <= now)
  const completionRatePct =
    pastWorkouts.length > 0
      ? Math.round((pastWorkouts.filter((w) => w.status === "COMPLETED").length / pastWorkouts.length) * 100)
      : 0

  // --- Répartition par type ---
  const typeCounts = new Map<string, number>()
  for (const w of rangeWorkouts) {
    typeCounts.set(w.type, (typeCounts.get(w.type) ?? 0) + 1)
  }
  const workoutTypeBreakdown = Array.from(typeCounts.entries())
    .map(([type, value]) => ({
      type: workoutTypeLabels[type as (typeof workoutTypeValues)[number]] ?? type,
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  // --- Athlètes inactifs ---
  const lastCompletedByAthlete = new Map<string, Date>()
  for (const w of completedWorkouts) {
    if (!lastCompletedByAthlete.has(w.athleteId)) lastCompletedByAthlete.set(w.athleteId, w.scheduledDate)
  }
  const inactiveAthletes = athletes
    .map((a) => {
      const last = lastCompletedByAthlete.get(a.id)
      if (!last) {
        const daysSinceCreated = Math.floor((now.getTime() - a.createdAt.getTime()) / 86400000)
        return daysSinceCreated >= INACTIVE_AFTER_DAYS
          ? { athlete: `${a.firstName} ${a.lastName}`, lastActivity: "jamais" }
          : null
      }
      const daysAgo = Math.floor((now.getTime() - last.getTime()) / 86400000)
      return daysAgo >= INACTIVE_AFTER_DAYS
        ? { athlete: `${a.firstName} ${a.lastName}`, lastActivity: `il y a ${daysAgo} jour${daysAgo > 1 ? "s" : ""}` }
        : null
    })
    .filter((x): x is { athlete: string; lastActivity: string } => x !== null)

  // --- Alertes blessures (à partir du journal des 2 dernières semaines) ---
  const athleteName = new Map(athletes.map((a) => [a.id, `${a.firstName} ${a.lastName}`]))
  const entriesByAthlete = new Map<string, typeof journalEntries>()
  for (const e of journalEntries) {
    if (!entriesByAthlete.has(e.athleteId)) entriesByAthlete.set(e.athleteId, [])
    entriesByAthlete.get(e.athleteId)!.push(e)
  }
  const injuryAlerts: { athlete: string; detail: string; since: string }[] = []
  for (const [athleteId, rows] of entriesByAthlete) {
    const name = athleteName.get(athleteId)
    if (!name) continue
    const [latest, previous] = rows
    const daysAgo = Math.floor((now.getTime() - latest.date.getTime()) / 86400000)
    const since = daysAgo <= 0 ? "aujourd'hui" : `il y a ${daysAgo} jour${daysAgo > 1 ? "s" : ""}`

    if (latest.rpe != null && latest.rpe >= 9) {
      injuryAlerts.push({ athlete: name, detail: `Ressenti très élevé (${latest.rpe}/10) au dernier retour`, since })
    } else if (previous && (latest.fatigue ?? 0) >= 8 && (previous.fatigue ?? 0) >= 8) {
      injuryAlerts.push({ athlete: name, detail: "Fatigue élevée sur les 2 derniers retours", since })
    } else if ((latest.stress ?? 0) >= 8 && latest.sleepQuality != null && latest.sleepQuality <= 3) {
      injuryAlerts.push({ athlete: name, detail: "Stress élevé et sommeil dégradé", since })
    }
  }

  // --- Évènements à venir (objectifs avec échéance) ---
  const upcomingEvents = upcomingGoals.map((g) => ({
    id: g.id,
    name: g.title,
    athlete: `${g.athlete.firstName} ${g.athlete.lastName}`,
    date: g.targetDate!,
    type: g.type === "RACE" ? "Course" : g.type === "HEALTH" ? "Santé" : "Objectif",
  }))

  return {
    athletes: allAthletes,
    athleteCount: athletes.length,
    sessionsThisWeek,
    weeklyLoadKm: currentWeekLoad,
    weeklyLoadTrendPct,
    completionRatePct,
    weeklyLoad,
    workoutTypeBreakdown,
    inactiveAthletes,
    injuryAlerts,
    upcomingEvents,
    calendarSessions: {
      month: calendarMonth,
      monthLabel: formatMonthLabel(calendarMonth),
      sessions: calendarSessions,
    },
  }
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>
