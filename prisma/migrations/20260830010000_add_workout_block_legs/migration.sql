-- CreateTable
CREATE TABLE "workout_block_legs" (
    "id" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "distanceMeters" INTEGER,
    "durationSeconds" INTEGER,
    "vmaPercent" INTEGER,
    "paceTargetSecPerKm" INTEGER,
    "recoveryAfterSeconds" INTEGER,

    CONSTRAINT "workout_block_legs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workout_block_legs_blockId_idx" ON "workout_block_legs"("blockId");

-- AddForeignKey
ALTER TABLE "workout_block_legs" ADD CONSTRAINT "workout_block_legs_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "workout_blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
