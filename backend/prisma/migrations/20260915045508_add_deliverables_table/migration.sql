-- CreateEnum
CREATE TYPE "DeliverableType" AS ENUM ('TIKTOK', 'IG_STORY', 'IG_POST', 'IG_REEL', 'YOUTUBE_SHORT', 'YOUTUBE_VIDEO', 'OTHER');

-- CreateEnum
CREATE TYPE "DeliverableStatus" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED');

-- CreateTable
CREATE TABLE "deliverables" (
    "id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "type" "DeliverableType" NOT NULL,
    "description" TEXT,
    "due_date" DATE NOT NULL,
    "status" "DeliverableStatus" NOT NULL DEFAULT 'PENDING',
    "submitted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "deliverables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deliverables_deal_id_idx" ON "deliverables"("deal_id");

-- CreateIndex
CREATE INDEX "deliverables_due_date_idx" ON "deliverables"("due_date");

-- AddForeignKey
ALTER TABLE "deliverables" ADD CONSTRAINT "deliverables_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
