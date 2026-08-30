-- AlterTable
ALTER TABLE "workouts" ADD COLUMN "photoUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
