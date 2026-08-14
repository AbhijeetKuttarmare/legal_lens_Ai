-- AlterTable
ALTER TABLE "User" ADD COLUMN     "compareTrialUntil" TIMESTAMP(3),
ADD COLUMN     "templatesTrialUntil" TIMESTAMP(3),
ADD COLUMN     "exportTrialUntil" TIMESTAMP(3),
ADD COLUMN     "chatTrialUntil" TIMESTAMP(3);
