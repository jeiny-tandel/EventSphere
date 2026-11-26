-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "maxTicketsPerUser" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "price" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "EventRegistration" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1;
