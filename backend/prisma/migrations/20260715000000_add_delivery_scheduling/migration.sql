-- Add delivery-stop state without changing the core order-status workflow.
CREATE TYPE "DeliveryStopStatus" AS ENUM ('ASSIGNED', 'DELIVERED', 'FAILED');

ALTER TABLE "Order"
ADD COLUMN "deliveryStopStatus" "DeliveryStopStatus",
ADD COLUMN "scheduledDeliveryDate" TIMESTAMP(3),
ADD COLUMN "deliveryLatitude" DOUBLE PRECISION,
ADD COLUMN "deliveryLongitude" DOUBLE PRECISION,
ADD COLUMN "stopSequence" INTEGER,
ADD COLUMN "failedReason" TEXT,
ADD COLUMN "deliveredAt" TIMESTAMP(3);

CREATE TABLE "DeliveryScheduleReport" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "scheduleDate" TIMESTAMP(3) NOT NULL,
    "totalStops" INTEGER NOT NULL,
    "pendingStops" INTEGER NOT NULL,
    "deliveredStops" INTEGER NOT NULL,
    "failedStops" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryScheduleReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Order_driverId_scheduledDeliveryDate_idx"
ON "Order"("driverId", "scheduledDeliveryDate");

CREATE INDEX "Order_deliveryStopStatus_idx"
ON "Order"("deliveryStopStatus");

CREATE UNIQUE INDEX "DeliveryScheduleReport_driverId_scheduleDate_key"
ON "DeliveryScheduleReport"("driverId", "scheduleDate");

CREATE INDEX "DeliveryScheduleReport_scheduleDate_idx"
ON "DeliveryScheduleReport"("scheduleDate");

ALTER TABLE "DeliveryScheduleReport"
ADD CONSTRAINT "DeliveryScheduleReport_driverId_fkey"
FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
