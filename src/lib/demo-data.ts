// Données de démonstration pour prévisualiser l'UI avant le branchement complet à la base de données.

export const demoStats = {
  athleteCount: 14,
  sessionsThisWeek: 23,
  weeklyLoadKm: 187.4,
  weeklyLoadTrendPct: 8.2,
  completionRatePct: 91,
}

export const demoWeeklyLoad = [
  { week: "S1", volumeKm: 132, seances: 18 },
  { week: "S2", volumeKm: 148, seances: 20 },
  { week: "S3", volumeKm: 121, seances: 16 },
  { week: "S4", volumeKm: 165, seances: 21 },
  { week: "S5", volumeKm: 172, seances: 22 },
  { week: "S6", volumeKm: 159, seances: 19 },
  { week: "S7", volumeKm: 178, seances: 24 },
  { week: "S8", volumeKm: 187, seances: 23 },
]

export const demoWorkoutTypeBreakdown = [
  { type: "Endurance fondamentale", value: 38 },
  { type: "Fractionné / VMA", value: 22 },
  { type: "Seuil", value: 16 },
  { type: "Sortie longue", value: 14 },
  { type: "Récupération", value: 10 },
]

export const demoInjuryAlerts = [
  {
    athlete: "Léa Fontaine",
    detail: "Douleur au mollet signalée — 2 séances consécutives à ressenti > 8/10",
    since: "il y a 2 jours",
  },
  {
    athlete: "Marc Dubreuil",
    detail: "Fatigue élevée persistante (7 jours) + sommeil < 6h",
    since: "il y a 4 jours",
  },
]

export const demoInactiveAthletes = [
  { athlete: "Julien Perrot", lastActivity: "il y a 9 jours" },
  { athlete: "Camille Nguyen", lastActivity: "il y a 12 jours" },
]

export const demoUpcomingEvents = [
  { athlete: "Sophie Marchand", name: "Semi-marathon de Lyon", date: "2026-09-14", type: "Course" },
  { athlete: "Thomas Roy", name: "10 km de la Défense", date: "2026-09-07", type: "Course" },
  { athlete: "Léa Fontaine", name: "Stage altitude Font-Romeu", date: "2026-09-21", type: "Stage" },
]

export const demoAthletes = [
  {
    id: "1",
    firstName: "Sophie",
    lastName: "Marchand",
    status: "ACTIVE" as const,
    mainGoal: "Semi-marathon sub 1h35",
    goalDate: "2026-09-14",
    weeklyKm: 62,
    vma: 17.5,
  },
  {
    id: "2",
    firstName: "Thomas",
    lastName: "Roy",
    status: "ACTIVE" as const,
    mainGoal: "10 km sub 38'",
    goalDate: "2026-09-07",
    weeklyKm: 48,
    vma: 18.2,
  },
  {
    id: "3",
    firstName: "Léa",
    lastName: "Fontaine",
    status: "ACTIVE" as const,
    mainGoal: "Marathon de Paris",
    goalDate: "2027-04-11",
    weeklyKm: 71,
    vma: 16.8,
  },
  {
    id: "4",
    firstName: "Marc",
    lastName: "Dubreuil",
    status: "ACTIVE" as const,
    mainGoal: "Retour à la compétition",
    goalDate: "2026-11-02",
    weeklyKm: 35,
    vma: 15.4,
  },
  {
    id: "5",
    firstName: "Julien",
    lastName: "Perrot",
    status: "INACTIVE" as const,
    mainGoal: "Trail 30 km",
    goalDate: "2026-10-18",
    weeklyKm: 0,
    vma: 16.1,
  },
  {
    id: "6",
    firstName: "Camille",
    lastName: "Nguyen",
    status: "INACTIVE" as const,
    mainGoal: "Premier marathon",
    goalDate: "2027-04-11",
    weeklyKm: 0,
    vma: 14.9,
  },
]
