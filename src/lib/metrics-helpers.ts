import type { AthleteMetricsInput } from "@/lib/validations/metrics"
import { toOptionalFloat, toOptionalInt } from "@/lib/validations/shared"
import { parseClockToSeconds, paceFromRaceTime } from "@/lib/time"

const HALF_MARATHON_KM = 21.0975
const MARATHON_KM = 42.195

export function hasAnyMetric(data: AthleteMetricsInput) {
  return Boolean(
    data.vma || data.maxHeartRate || data.restingHeartRate || data.weightKg ||
      data.time5k || data.time10k || data.timeHalfMarathon || data.timeMarathon
  )
}

export function buildAthleteMetricsData(data: AthleteMetricsInput) {
  return {
    vma: toOptionalFloat(data.vma),
    maxHeartRate: toOptionalInt(data.maxHeartRate),
    restingHeartRate: toOptionalInt(data.restingHeartRate),
    weightKg: toOptionalFloat(data.weightKg),
    pace5k: paceFromRaceTime(parseClockToSeconds(data.time5k), 5),
    pace10k: paceFromRaceTime(parseClockToSeconds(data.time10k), 10),
    paceHalfMarathon: paceFromRaceTime(parseClockToSeconds(data.timeHalfMarathon), HALF_MARATHON_KM),
    paceMarathon: paceFromRaceTime(parseClockToSeconds(data.timeMarathon), MARATHON_KM),
    source: "MANUAL" as const,
  }
}
