ALTER TABLE "workout_blocks" ADD COLUMN "sets" INTEGER;
ALTER TABLE "workout_blocks" ADD COLUMN "recoveryBetweenSetsSeconds" INTEGER;
ALTER TABLE "workout_blocks" ADD COLUMN "actualRepSecondsList" INTEGER[] NOT NULL DEFAULT '{}';
