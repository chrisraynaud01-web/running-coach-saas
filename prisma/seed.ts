import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10)

  const coachUser = await prisma.user.upsert({
    where: { email: "sarah.coach@runcoach.app" },
    update: {},
    create: {
      email: "sarah.coach@runcoach.app",
      name: "Sarah Coach",
      role: "COACH",
      passwordHash,
      coachProfile: {
        create: {
          bio: "Coach running spécialisée demi-fond et marathon, 10 ans d'expérience.",
          phone: "+33 6 12 34 56 78",
        },
      },
    },
    include: { coachProfile: true },
  })
  const coach = coachUser.coachProfile!

  const exercises = [
    { name: "Endurance fondamentale", category: "ENDURANCE_FONDAMENTALE", description: "Allure conversationnelle, développement aérobie de base.", instructions: "Rester sous 75% FCM, respiration facile.", intensity: "FAIBLE" },
    { name: "Seuil anaérobie", category: "SEUIL", description: "Course à allure seuil pour repousser le point de rupture lactique.", instructions: "Allure semi-marathon à marathon rapide, effort soutenu mais contrôlé.", intensity: "ELEVEE" },
    { name: "VMA courte", category: "VMA", description: "Répétitions courtes à vitesse maximale aérobie.", instructions: "30/30, 200-400m à VMA avec récup active.", intensity: "MAXIMALE" },
    { name: "Fractionné court", category: "FRACTIONNE_COURT", description: "Répétitions de 200 à 600m à haute intensité.", instructions: "Récupération courte, focus sur la vitesse.", intensity: "ELEVEE" },
    { name: "Fractionné long", category: "FRACTIONNE_LONG", description: "Répétitions de 1000 à 3000m proches de l'allure 10km.", instructions: "Récupération 1-2min trot, gestion de l'allure.", intensity: "ELEVEE" },
    { name: "Sortie longue", category: "SORTIE_LONGUE", description: "Sortie longue en endurance pour développer l'endurance spécifique.", instructions: "Allure régulière, hydratation et ravitaillement à travailler.", intensity: "MODEREE" },
    { name: "Récupération active", category: "RECUPERATION", description: "Footing très lent pour favoriser la récupération.", instructions: "Allure très facile, focus sur la relâchement.", intensity: "FAIBLE" },
    { name: "Gainage", category: "GAINAGE", description: "Renforcement de la sangle abdominale et lombaire.", instructions: "Planche, gainage latéral, 3 x 45s.", intensity: "MODEREE" },
    { name: "Squats", category: "SQUATS", description: "Renforcement des membres inférieurs.", instructions: "3 x 15 répétitions, poids du corps ou charge légère.", intensity: "MODEREE" },
    { name: "Fentes", category: "FENTES", description: "Renforcement unilatéral, stabilité.", instructions: "3 x 12 répétitions par jambe.", intensity: "MODEREE" },
    { name: "Core training", category: "CORE_TRAINING", description: "Circuit de renforcement du tronc.", instructions: "Circuit de 20min, 6 exercices en rotation.", intensity: "MODEREE" },
  ] as const

  for (const ex of exercises) {
    const existing = await prisma.exercise.findFirst({ where: { name: ex.name } })
    if (!existing) {
      await prisma.exercise.create({ data: { ...ex, isSystem: true } })
    }
  }

  const athletesData = [
    {
      firstName: "Sophie", lastName: "Marchand", email: "sophie.marchand@example.com",
      phone: "+33 6 11 22 33 44", birthDate: new Date("1992-03-14"), sex: "FEMALE" as const,
      heightCm: 168, weightKg: 57, status: "ACTIVE" as const,
      vma: 17.5, maxHeartRate: 191, restingHeartRate: 48,
      pace5k: 234, pace10k: 246, paceHalfMarathon: 258, paceMarathon: 276,
      goal: { title: "Semi-marathon de Lyon", type: "RACE" as const, targetDate: new Date("2026-09-14"), targetValue: "sub 1h35" },
    },
    {
      firstName: "Thomas", lastName: "Roy", email: "thomas.roy@example.com",
      phone: "+33 6 22 33 44 55", birthDate: new Date("1988-07-02"), sex: "MALE" as const,
      heightCm: 179, weightKg: 71, status: "ACTIVE" as const,
      vma: 18.2, maxHeartRate: 188, restingHeartRate: 52,
      pace5k: 222, pace10k: 231, paceHalfMarathon: 243, paceMarathon: 258,
      goal: { title: "10 km de la Défense", type: "RACE" as const, targetDate: new Date("2026-09-07"), targetValue: "sub 38'" },
    },
    {
      firstName: "Léa", lastName: "Fontaine", email: "lea.fontaine@example.com",
      phone: "+33 6 33 44 55 66", birthDate: new Date("1995-11-23"), sex: "FEMALE" as const,
      heightCm: 165, weightKg: 54, status: "ACTIVE" as const,
      vma: 16.8, maxHeartRate: 194, restingHeartRate: 50,
      pace5k: 246, pace10k: 258, paceHalfMarathon: 270, paceMarathon: 288,
      goal: { title: "Marathon de Paris", type: "RACE" as const, targetDate: new Date("2027-04-11"), targetValue: "sub 3h30" },
    },
    {
      firstName: "Marc", lastName: "Dubreuil", email: "marc.dubreuil@example.com",
      phone: "+33 6 44 55 66 77", birthDate: new Date("1979-05-30"), sex: "MALE" as const,
      heightCm: 175, weightKg: 76, status: "ACTIVE" as const,
      vma: 15.4, maxHeartRate: 178, restingHeartRate: 58,
      pace5k: 270, pace10k: 285, paceHalfMarathon: 300, paceMarathon: 324,
      goal: { title: "Retour à la compétition", type: "HEALTH" as const, targetDate: new Date("2026-11-02"), targetValue: "Reprise progressive post-blessure" },
    },
    {
      firstName: "Julien", lastName: "Perrot", email: "julien.perrot@example.com",
      phone: "+33 6 55 66 77 88", birthDate: new Date("1990-09-18"), sex: "MALE" as const,
      heightCm: 182, weightKg: 74, status: "INACTIVE" as const,
      vma: 16.1, maxHeartRate: 190, restingHeartRate: 55,
      pace5k: 258, pace10k: 270, paceHalfMarathon: 282, paceMarathon: 300,
      goal: { title: "Trail 30 km", type: "RACE" as const, targetDate: new Date("2026-10-18"), targetValue: "Finisher" },
    },
    {
      firstName: "Camille", lastName: "Nguyen", email: "camille.nguyen@example.com",
      phone: "+33 6 66 77 88 99", birthDate: new Date("1997-01-09"), sex: "FEMALE" as const,
      heightCm: 162, weightKg: 53, status: "INACTIVE" as const,
      vma: 14.9, maxHeartRate: 196, restingHeartRate: 60,
      pace5k: 288, pace10k: 303, paceHalfMarathon: 318, paceMarathon: 342,
      goal: { title: "Premier marathon", type: "RACE" as const, targetDate: new Date("2027-04-11"), targetValue: "Finisher" },
    },
  ]

  for (const a of athletesData) {
    const existing = await prisma.athlete.findFirst({ where: { email: a.email, coachId: coach.id } })
    const athlete =
      existing ??
      (await prisma.athlete.create({
        data: {
          coachId: coach.id,
          firstName: a.firstName,
          lastName: a.lastName,
          email: a.email,
          phone: a.phone,
          birthDate: a.birthDate,
          sex: a.sex,
          heightCm: a.heightCm,
          weightKg: a.weightKg,
          status: a.status,
        },
      }))

    await prisma.athleteMetrics.upsert({
      where: { id: `seed-metrics-${athlete.id}` },
      update: {},
      create: {
        id: `seed-metrics-${athlete.id}`,
        athleteId: athlete.id,
        vma: a.vma,
        maxHeartRate: a.maxHeartRate,
        restingHeartRate: a.restingHeartRate,
        pace5k: a.pace5k,
        pace10k: a.pace10k,
        paceHalfMarathon: a.paceHalfMarathon,
        paceMarathon: a.paceMarathon,
        weightKg: a.weightKg,
        source: "MANUAL",
      },
    })

    await prisma.goal.upsert({
      where: { id: `seed-goal-${athlete.id}` },
      update: {},
      create: {
        id: `seed-goal-${athlete.id}`,
        athleteId: athlete.id,
        title: a.goal.title,
        type: a.goal.type,
        targetDate: a.goal.targetDate,
        targetValue: a.goal.targetValue,
        isPrimary: true,
        status: "ACTIVE",
      },
    })

    await prisma.conversation.upsert({
      where: { athleteId: athlete.id },
      update: {},
      create: { coachId: coach.id, athleteId: athlete.id },
    })
  }

  // Quelques séances déjà planifiées pour les deux premiers athlètes actifs
  const [sophie, thomas] = await prisma.athlete.findMany({
    where: { coachId: coach.id },
    orderBy: { createdAt: "asc" },
    take: 2,
  })

  const today = new Date()
  const daysFromNow = (n: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + n)
    d.setHours(7, 0, 0, 0)
    return d
  }

  const sampleWorkouts = [
    { athleteId: sophie.id, title: "Endurance fondamentale 50min", type: "ENDURANCE_FONDAMENTALE" as const, date: daysFromNow(-2), status: "COMPLETED" as const, plannedDistanceMeters: 9000, plannedDurationSeconds: 3000 },
    { athleteId: sophie.id, title: "10 x 400m à VMA", type: "VMA" as const, date: daysFromNow(1), status: "PLANNED" as const, plannedDistanceMeters: 4000, plannedDurationSeconds: 1800 },
    { athleteId: thomas.id, title: "Sortie longue 18km", type: "SORTIE_LONGUE" as const, date: daysFromNow(-1), status: "COMPLETED" as const, plannedDistanceMeters: 18000, plannedDurationSeconds: 5400 },
  ]

  for (const w of sampleWorkouts) {
    const exists = await prisma.workout.findFirst({ where: { athleteId: w.athleteId, title: w.title } })
    if (!exists) {
      await prisma.workout.create({
        data: {
          athleteId: w.athleteId,
          createdByCoachId: coach.id,
          title: w.title,
          type: w.type,
          status: w.status,
          scheduledDate: w.date,
          plannedDistanceMeters: w.plannedDistanceMeters,
          plannedDurationSeconds: w.plannedDurationSeconds,
        },
      })
    }
  }

  console.log("Seed terminé.")
  console.log("Connexion coach de démo -> email: sarah.coach@runcoach.app / mot de passe: password123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
