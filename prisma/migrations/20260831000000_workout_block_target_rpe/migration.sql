-- AlterTable
ALTER TABLE "workout_blocks" DROP COLUMN "intensity";
ALTER TABLE "workout_blocks" ADD COLUMN "targetRpe" INTEGER;
