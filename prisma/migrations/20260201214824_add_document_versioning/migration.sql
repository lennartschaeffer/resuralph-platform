/*
  Warnings:

  - You are about to drop the column `uploader` on the `documents` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[uploaderId,version]` on the table `documents` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uploaderId` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uploaderUsername` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `version` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "documents" DROP COLUMN "uploader",
ADD COLUMN     "title" TEXT,
ADD COLUMN     "uploaderId" TEXT NOT NULL,
ADD COLUMN     "uploaderUsername" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "documents_uploaderId_version_key" ON "documents"("uploaderId", "version");
