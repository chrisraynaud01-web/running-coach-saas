import { z } from "zod"
import { integerField, clockField } from "./shared"
import { TIME_OF_DAY_VALUES } from "@/lib/time"

export const workoutTypeValues = [
  "ENDURANCE_FONDAMENTALE",
  "SEUIL",
  "VMA",
  "FRACTIONNE_COURT",
  "FRACTIONNE_LONG",
  "SORTIE_LONGUE",
  "RECUPERATION",
  "RENFORCEMENT",
  "COMPETITION",
  "AUTRE",
] as const

export const workoutTypeLabels: Record<(typeof workoutTypeValues)[number], string> = {
  ENDURANCE_FONDAMENTALE: "Endurance fondamentale",
  SEUIL: "Seuil",
  VMA: "VMA",
  FRACTIONNE_COURT: "Fractionné court",
  FRACTIONNE_LONG: "Fractionné long",
  SORTIE_LONGUE: "Sortie longue",
  RECUPERATION: "Récupération",
  RENFORCEMENT: "Renforcement musculaire",
  COMPETITION: "Compétition",
  AUTRE: "Autre",
}

export const workoutBlockTypeValues = [
  "ECHAUFFEMENT",
  "CORPS_DE_SEANCE",
  "RETOUR_AU_CALME",
  "REPOS",
] as const

export const workoutBlockTypeLabels: Record<(typeof workoutBlockTypeValues)[number], string> = {
  ECHAUFFEMENT: "Échauffement",
  CORPS_DE_SEANCE: "Corps de séance",
  RETOUR_AU_CALME: "Retour au calme",
  REPOS: "Repos",
}

// Types de séance en effort continu : le bloc n'a besoin que d'une durée et d'une allure
// (pas de distance/séries/répétitions, qui n'ont de sens que pour du fractionné).
export const continuousWorkoutTypes: readonly (typeof workoutTypeValues)[number][] = [
  "ENDURANCE_FONDAMENTALE",
  "SORTIE_LONGUE",
  "RECUPERATION",
]

// Types de séance sans structure course à pied (distance/allure/blocs) : uniquement du texte
// libre décrivant le contenu (ex : exercices de musculation, séries, charges).
export const freeformWorkoutTypes: readonly (typeof workoutTypeValues)[number][] = ["RENFORCEMENT"]

export const intensityValues = ["FAIBLE", "MODEREE", "ELEVEE", "MAXIMALE"] as const

export const intensityLabels: Record<(typeof intensityValues)[number], string> = {
  FAIBLE: "Faible",
  MODEREE: "Modérée",
  ELEVEE: "Élevée",
  MAXIMALE: "Maximale",
}

// Une "portion" au sein d'un bloc à portions enchaînées (ex : le "200m à allure A" dans
// "200m@A -> 300m@B -> 200m@A"). Chaque portion a sa propre distance et sa propre allure.
export const workoutBlockLegSchema = z.object({
  distanceMeters: integerField,
  durationManual: clockField,
  vmaPercent: integerField,
  paceManual: clockField,
  // Récupération après cette portion, avant la suivante du même tour (pas de sens sur la
  // dernière portion : la transition entre deux tours passe par recoveryBetweenSets du bloc).
  recoveryAfter: clockField,
})

export type WorkoutBlockLegInput = z.infer<typeof workoutBlockLegSchema>

export const workoutBlockSchema = z.object({
  type: z.enum(workoutBlockTypeValues),
  label: z.string().max(200).optional().or(z.literal("")),
  sets: integerField,
  repetitions: integerField,
  distanceMeters: integerField,
  durationManual: clockField,
  vmaPercent: integerField,
  paceManual: clockField,
  recoveryDuration: clockField,
  recoveryBetweenSets: clockField,
  intensity: z.enum(intensityValues).optional(),
  // Présent uniquement pour un bloc "portions enchaînées" (ex : 4 tours de 200m@A/300m@B/200m@A)
  // — quand non vide, distanceMeters/vmaPercent/paceManual/durationManual du bloc sont ignorés.
  legs: z.array(workoutBlockLegSchema).max(10).optional(),
})

export type WorkoutBlockInput = z.infer<typeof workoutBlockSchema>

export const workoutSchema = z.object({
  athleteId: z.string().min(1),
  title: z.string().min(1, "Titre requis").max(150),
  type: z.enum(workoutTypeValues),
  scheduledDate: z.string().min(1, "Date requise"),
  timeOfDay: z.enum(TIME_OF_DAY_VALUES),
  coachNotes: z.string().max(2000).optional().or(z.literal("")),
  blocks: z.array(workoutBlockSchema).max(20),
})

export type WorkoutInput = z.infer<typeof workoutSchema>

// Même séance planifiée pour plusieurs athlètes à la fois — chaque athlète reçoit sa propre
// séance, avec l'allure des blocs recalculée à partir de sa propre VMA.
export const bulkWorkoutSchema = z.object({
  athleteIds: z.array(z.string().min(1)).min(1, "Sélectionne au moins un athlète"),
  title: z.string().min(1, "Titre requis").max(150),
  type: z.enum(workoutTypeValues),
  scheduledDate: z.string().min(1, "Date requise"),
  timeOfDay: z.enum(TIME_OF_DAY_VALUES),
  coachNotes: z.string().max(2000).optional().or(z.literal("")),
  blocks: z.array(workoutBlockSchema).max(20),
})

export type BulkWorkoutInput = z.infer<typeof bulkWorkoutSchema>
