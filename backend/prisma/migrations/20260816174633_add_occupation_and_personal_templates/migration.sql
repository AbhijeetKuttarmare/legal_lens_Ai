-- AlterTable
ALTER TABLE "User" ADD COLUMN     "occupation" TEXT;

-- CreateTable
CREATE TABLE "PersonalTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceFileName" TEXT NOT NULL,
    "extractedText" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PersonalTemplate_userId_idx" ON "PersonalTemplate"("userId");

-- AddForeignKey
ALTER TABLE "PersonalTemplate" ADD CONSTRAINT "PersonalTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

